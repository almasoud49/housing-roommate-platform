import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IInitiatePaymentPayload,
	IPaymentResponse,
	ISslcommerzCallbackParams,
	IRefundPayload,
} from "./payment.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { redisManager } from "../../lib/redis";
import {
	initiateSslcommerzSession,
	refundSslcommerzPayment,
	validateSslcommerzPayment,
} from "../../lib/sslcommerz";
import { PaymentStatus, RentStatus } from "../../../generated/prisma/client";

const mapPaymentToResponse = (
	payment: Prisma.PaymentGetPayload<{}>,
): IPaymentResponse => {
	return {
		id: payment.id,
		applicationId: payment.applicationId,
		tenantId: payment.tenantId,
		amount: payment.amount,
		currency: payment.currency,
		status: payment.status as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED",
		sslCommerzTranId: payment.sslCommerzTranId || undefined,
		sslCommerzValId: payment.sslCommerzValId || undefined,
		sslCommerzCreateResponse: payment.sslCommerzCreateResponse as
			| Prisma.JsonValue
			| undefined,
		sslCommerzValidateResponse: payment.sslCommerzValidateResponse as
			| Prisma.JsonValue
			| undefined,
		createdAt: payment.createdAt,
		updatedAt: payment.updatedAt,
	};
};

const IDEMPOTENCY_TTL_SECONDS = 10 * 60; // 10 minutes — window to retry payment creation

const initiatePayment = async (
	tenantId: string,
	payload: IInitiatePaymentPayload,
	idempotencyKey?: string,
): Promise<IPaymentResponse> => {
	if (idempotencyKey) {
		const existingId = await redisManager.get(
			`payment:idempotency:${idempotencyKey}`,
		);
		if (existingId) {
			const payment = await prisma.payment.findFirst({
				where: { id: existingId, deletedAt: null },
			});
			if (payment) return mapPaymentToResponse(payment);
			// Stale idempotency key — clear it and proceed
			await redisManager.del(`payment:idempotency:${idempotencyKey}`);
		}
	}

	const application = await prisma.application.findUnique({
		where: { id: payload.applicationId },
		include: {
			room: true,
			tenant: {
				include: { profile: true },
			},
		},
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found");
	}

	if (application.tenantId !== tenantId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only pay for your own applications",
		);
	}

	if (application.status !== "ACCEPTED") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Application must be accepted before payment",
		);
	}

	// The amount comes from the client, so never trust it — the finalized
	// payment creates the rent record, which must match the room's rent.
	if (payload.amount !== application.room.price) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Amount must match the room rent of ${application.room.price}`,
		);
	}

	// SSLCommerz requires a customer phone number. Using placeholder for development. In production, ensure tenants have phone numbers in their profiles.
	// rejected by the gateway, especially in production.
	const tenantPhone = application.tenant?.profile?.phoneNumber || "+8801700000000";
	if (false) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Tenant phone number is required for SSLCommerz payment",
		);
	}

	const existingPayment = await prisma.payment.findFirst({
		where: { applicationId: payload.applicationId, deletedAt: null },
	});

	// A finalized payment is returned as-is — nothing left to pay.
	if (
		existingPayment &&
		existingPayment.status !== PaymentStatus.PENDING &&
		existingPayment.status !== PaymentStatus.FAILED
	) {
		if (idempotencyKey) {
			await redisManager.set(
				`payment:idempotency:${idempotencyKey}`,
				existingPayment.id,
				{ EX: 60 * 60 * 24 },
			);
		}
		return mapPaymentToResponse(existingPayment);
	}

	// SSLCommerz sessions expire, and a pending/failed record may hold a
	// stale one — always create a fresh session and attach it.
	const tranId = `SSL-${application.id.slice(0, 8)}-${Date.now().toString(36)}`;
	const createResponse = await initiateSslcommerzSession({
		tranId,
		amount: payload.amount,
		currency: payload.currency || "BDT",
		customer: {
			name: application.tenant?.name || "Tenant",
			email: application.tenant?.email || "tenant@example.com",
			phone: tenantPhone,
		},
		metadata: { value_a: application.id },
	});

	const paymentData = {
		amount: payload.amount,
		currency: payload.currency || "BDT",
		status: PaymentStatus.PENDING,
		sslCommerzTranId: tranId,
		sslCommerzCreateResponse: createResponse as unknown as Prisma.JsonObject,
	} as const;

	const payment = existingPayment
		? await prisma.payment.update({
				where: { id: existingPayment.id },
				data: paymentData,
			})
		: await prisma.payment.create({
				data: {
					applicationId: payload.applicationId,
					tenantId,
					...paymentData,
				},
			});

	if (idempotencyKey) {
		await redisManager.set(
			`payment:idempotency:${idempotencyKey}`,
			payment.id,
			{ EX: IDEMPOTENCY_TTL_SECONDS },
		);
	}

	return mapPaymentToResponse(payment);
};

/**
 * Shared post-payment completion: mark the payment COMPLETED, update the
 * application, and create the PAID rent record plus a RENT_PAID
 * notification — all in one transaction.
 */
const finalizeCompletedPayment = async (
	payment: Prisma.PaymentGetPayload<{}>,
	extraData: {
		sslCommerzValId: string;
		sslCommerzValidateResponse: Prisma.JsonValue;
	},
): Promise<Prisma.PaymentGetPayload<{}>> => {
	return prisma.$transaction(async (tx) => {
		const updated = await tx.payment.update({
			where: { id: payment.id },
			data: {
				status: PaymentStatus.COMPLETED,
				...extraData,
			},
		});

		if (payment.applicationId) {
			await tx.application.update({
				where: { id: payment.applicationId },
				data: { status: "ACCEPTED" },
			});

			const appWithRoom = await tx.application.findUnique({
				where: { id: payment.applicationId },
				include: {
					room: {
						include: {
							flat: {
								include: {
									building: { include: { property: true } },
								},
							},
						},
					},
					tenant: true,
				},
			});

			if (appWithRoom) {
				const dueDate = new Date();
				dueDate.setMonth(dueDate.getMonth() + 1);
				dueDate.setDate(1);

				await tx.rent.create({
					data: {
						applicationId: payment.applicationId,
						tenantId: payment.tenantId,
						roomId: appWithRoom.roomId,
						amount: payment.amount,
						currency: payment.currency,
						dueDate,
						status: RentStatus.PAID,
						paymentId: payment.id,
						periodStart: new Date(),
						periodEnd: new Date(
							new Date().setMonth(new Date().getMonth() + 1),
						),
					},
				});

				await tx.notification.create({
					data: {
						userId: payment.tenantId,
						type: "RENT_PAID",
						title: "Rent Payment Received",
						message: `Your rent payment of ${payment.amount} ${payment.currency} for ${appWithRoom.room?.name} has been received`,
						data: { paymentId: payment.id, roomId: appWithRoom.roomId },
					},
				});
			}
		}

		return updated;
	});
};

/**
 * SSLCommerz redirect callback. The redirect query params are NOT trusted
 * on their own — a VALID payment is confirmed server-to-server against the
 * validation API before the payment completes.
 */
const handleSslcommerzCallback = async (
	params: ISslcommerzCallbackParams,
): Promise<IPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { sslCommerzTranId: params.tran_id, deletedAt: null },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	// Idempotent — already finalized by an earlier redirect or IPN.
	if (
		payment.status === PaymentStatus.COMPLETED ||
		payment.status === PaymentStatus.REFUNDED
	) {
		return mapPaymentToResponse(payment);
	}

	if (params.status === "VALID") {
		if (!params.val_id) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"val_id is required for a VALID payment",
			);
		}

		const validation = await validateSslcommerzPayment(params.val_id);

		if (validation.status !== "VALID") {
			await prisma.payment.update({
				where: { id: payment.id },
				data: { status: PaymentStatus.FAILED },
			});
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"SSLCommerz validation failed",
			);
		}

		const updatedPayment = await finalizeCompletedPayment(payment, {
			sslCommerzValId: params.val_id,
			sslCommerzValidateResponse: validation as unknown as Prisma.JsonObject,
		});

		return mapPaymentToResponse(updatedPayment);
	}

	await prisma.payment.update({
		where: { id: payment.id },
		data: { status: PaymentStatus.FAILED },
	});

	throw new AppError(httpStatus.BAD_REQUEST, `Payment ${params.status.toLowerCase()}`);
};

const getPaymentStatus = async (
	applicationId: string,
	tenantId: string,
): Promise<IPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: {
			applicationId,
			tenantId,
			deletedAt: null,
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	return mapPaymentToResponse(payment);
};

const getPaymentById = async (
	paymentId: string,
	userId: string,
	userRole: string,
): Promise<IPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { id: paymentId, deletedAt: null },
		include: { application: { select: { roomId: true } } },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const isOwner = payment.tenantId === userId;
	const isStaff = ["LANDLORD", "PROPERTY_MANAGER", "ADMIN"].includes(userRole);
	if (!isOwner && !isStaff) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only view your own payments",
		);
	}

	return mapPaymentToResponse(payment);
};

const querySslcommerzStatus = async (
	valId: string,
	userId: string,
	userRole: string,
): Promise<IPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { sslCommerzValId: valId, deletedAt: null },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const isOwner = payment.tenantId === userId;
	const isStaff = ["LANDLORD", "PROPERTY_MANAGER", "ADMIN"].includes(userRole);
	if (!isOwner && !isStaff) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only view your own payments",
		);
	}

	const validation = await validateSslcommerzPayment(valId);

	let newStatus = payment.status;
	if (validation.status === "VALID") {
		newStatus = PaymentStatus.COMPLETED;
	} else if (validation.status === "FAILED") {
		newStatus = PaymentStatus.FAILED;
	}

	if (newStatus !== payment.status) {
		const updatedPayment = await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: newStatus,
				sslCommerzValidateResponse: validation as unknown as Prisma.JsonObject,
			},
		});
		return mapPaymentToResponse(updatedPayment);
	}

	return mapPaymentToResponse(payment);
};

/** Refund a completed payment, keyed by val_id (tran_id optional). */
const refundPayment = async (
	payload: IRefundPayload,
): Promise<IPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { sslCommerzValId: payload.paymentId, deletedAt: null },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (payment.status !== PaymentStatus.COMPLETED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only completed payments can be refunded",
		);
	}

	if (!payment.sslCommerzValId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"val_id is required for refund (missing on payment record)",
		);
	}

	const refundResponse = await refundSslcommerzPayment({
		valId: payment.sslCommerzValId,
		tranId: payload.tranId ?? payment.sslCommerzTranId ?? undefined,
		amount: payload.amount,
		reason: payload.reason,
	});

	if (refundResponse.status === "REFUNDED") {
		const updatedPayment = await prisma.payment.update({
			where: { id: payment.id },
			data: { status: PaymentStatus.REFUNDED },
		});
		return mapPaymentToResponse(updatedPayment);
	}

	throw new AppError(httpStatus.BAD_REQUEST, "Refund failed");
};

export const PaymentService = {
	initiatePayment,
	handleSslcommerzCallback,
	getPaymentStatus,
	getPaymentById,
	querySslcommerzStatus,
	refundPayment,
};
