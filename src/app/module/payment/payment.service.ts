import crypto from "crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import config from "../../config";
import type {
	IInitiatePaymentPayload,
	IBkashPaymentResponse,
	IBkashCreatePaymentPayload,
	IBkashExecutePaymentPayload,
	IBkashQueryPaymentPayload,
	IBkashRefundPayload,
} from "./payment.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { redisManager } from "../../lib/redis";
import { getBkashIdToken } from "../../lib/bkash";
import { PaymentStatus, RentStatus } from "../../../generated/prisma/client";

interface BkashCreatePaymentResponse {
	paymentID: string;
	createTime: string;
	trxID: string;
	status: string;
	amount: string;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
}

interface BkashExecutePaymentResponse {
	paymentID: string;
	createTime: string;
	trxID: string;
	transactionStatus: string;
	amount: string;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
	executedTime: string;
}

interface BkashQueryPaymentResponse {
	paymentID: string;
	createTime: string;
	trxID: string;
	transactionStatus: string;
	amount: string;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
	executedTime?: string;
}

interface BkashRefundResponse {
	refundTransactionId: string;
	refundStatus: string;
	amount: string;
	currency: string;
	executedTime: string;
}

const getBkashAuthHeaders = async (): Promise<Record<string, string>> => ({
	Authorization: await getBkashIdToken(),
	"X-APP-Key": config.bkash_app_key!,
});

// Single POST helper for all bKash checkout APIs: same headers, JSON body,
// and error shape — only endpoint, body, and error prefix vary.
const bkashPost = async <T>(
	endpoint: string,
	body: Record<string, unknown>,
	errorPrefix: string,
): Promise<T> => {
	const headers = await getBkashAuthHeaders();

	const response = await fetch(`${config.bkash_base_url}${endpoint}`, {
		method: "POST",
		headers: {
			...headers,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`${errorPrefix}: ${error}`,
		);
	}

	return (await response.json()) as T;
};

const createBkashPayment = async (
	payload: IBkashCreatePaymentPayload,
): Promise<BkashCreatePaymentResponse> => {
	return bkashPost<BkashCreatePaymentResponse>(
		"/tokenized/checkout/create",
		{
			mode: "0011",
			payerReference: payload.payerReference,
			callbackURL: config.bkash_callback_url,
			amount: payload.amount.toString(),
			currency: payload.currency,
			intent: payload.intent,
			merchantInvoiceNumber: payload.merchantInvoiceNumber,
		},
		"bKash create payment error",
	);
};

const executeBkashPayment = async (
	payload: IBkashExecutePaymentPayload,
): Promise<BkashExecutePaymentResponse> => {
	return bkashPost<BkashExecutePaymentResponse>(
		"/tokenized/checkout/execute",
		{ paymentID: payload.paymentId },
		"bKash execute payment error",
	);
};

const queryBkashPayment = async (
	payload: IBkashQueryPaymentPayload,
): Promise<BkashQueryPaymentResponse> => {
	return bkashPost<BkashQueryPaymentResponse>(
		"/tokenized/checkout/payment/status",
		{ paymentID: payload.paymentId },
		"bKash query payment error",
	);
};

const refundBkashPayment = async (
	payload: IBkashRefundPayload,
): Promise<BkashRefundResponse> => {
	return bkashPost<BkashRefundResponse>(
		"/tokenized/checkout/refund",
		{
			paymentID: payload.paymentId,
			amount: payload.amount.toString(),
			currency: payload.currency,
			invoiceNumber: payload.invoiceNumber,
			reason: payload.reason,
		},
		"bKash refund error",
	);
};

const verifyBkashSignature = (payload: string, signature: string): boolean => {
	const expectedSignature = crypto
		.createHmac("sha256", config.bkash_app_secret!)
		.update(payload)
		.digest("hex");

	const received = Buffer.from(signature);
	const expected = Buffer.from(expectedSignature);

	// timingSafeEqual throws on length mismatch — unequal length means invalid
	if (received.length !== expected.length) return false;

	return crypto.timingSafeEqual(received, expected);
};

const mapPaymentToResponse = (
	payment: Prisma.PaymentGetPayload<{}>,
): IBkashPaymentResponse => {
	return {
		id: payment.id,
		applicationId: payment.applicationId,
		tenantId: payment.tenantId,
		amount: payment.amount,
		currency: payment.currency,
		status: payment.status as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED",
		bkashPaymentId: payment.bkashPaymentId || undefined,
		bkashCreateResponse: payment.bkashCreateResponse as
			| Prisma.JsonValue
			| undefined,
		bkashExecuteResponse: payment.bkashExecuteResponse as
			| Prisma.JsonValue
			| undefined,
		createdAt: payment.createdAt,
		updatedAt: payment.updatedAt,
	};
};

const initiatePayment = async (
	tenantId: string,
	payload: IInitiatePaymentPayload,
	idempotencyKey?: string,
): Promise<IBkashPaymentResponse> => {
	if (idempotencyKey) {
		const existing = await redisManager.get(
			`payment:idempotency:${idempotencyKey}`,
		);
		if (existing) {
			const payment = await prisma.payment.findUnique({
				where: { id: existing },
			});
			if (payment) return mapPaymentToResponse(payment);
		}
	}

	const application = await prisma.application.findUnique({
		where: { id: payload.applicationId },
		include: {
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

	const existingPayment = await prisma.payment.findFirst({
		where: { applicationId: payload.applicationId, deletedAt: null },
	});

	if (existingPayment) {
		if (idempotencyKey) {
			await redisManager.set(
				`payment:idempotency:${idempotencyKey}`,
				existingPayment.id,
				{ EX: 60 * 60 * 24 },
			);
		}
		return mapPaymentToResponse(existingPayment);
	}

	const payerReference =
		application.tenant?.profile?.phoneNumber || "01700000000";

	const merchantInvoiceNumber = `INV-${application.id.slice(0, 8)}-${Date.now()}`;
	const bkashCreateResponse = await createBkashPayment({
		amount: payload.amount,
		currency: payload.currency || "BDT",
		intent: "sale",
		merchantInvoiceNumber,
		payerReference,
	});

	const payment = await prisma.payment.create({
		data: {
			applicationId: payload.applicationId,
			tenantId,
			amount: payload.amount,
			currency: payload.currency || "BDT",
			status: PaymentStatus.PENDING,
			bkashPaymentId: bkashCreateResponse.paymentID,
			bkashCreateResponse: bkashCreateResponse as unknown as Prisma.JsonObject,
		},
	});

	if (idempotencyKey) {
		await redisManager.set(
			`payment:idempotency:${idempotencyKey}`,
			payment.id,
			{
				EX: 60 * 60 * 24,
			},
		);
	}

	return mapPaymentToResponse(payment);
};

const handleBkashCallback = async (
	paymentId: string,
	status: string,
	signature?: string,
): Promise<IBkashPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { bkashPaymentId: paymentId, deletedAt: null },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (signature) {
		const payload = JSON.stringify({ paymentId, status });
		if (!verifyBkashSignature(payload, signature)) {
			throw new AppError(httpStatus.FORBIDDEN, "Invalid webhook signature");
		}
	}

	if (status === "success") {
		const executeResponse = await executeBkashPayment({ paymentId });

		if (executeResponse.transactionStatus === "Completed") {
			const updatedPayment = await prisma.$transaction(async (tx) => {
				const updated = await tx.payment.update({
					where: { id: payment.id },
					data: {
						status: PaymentStatus.COMPLETED,
						bkashExecuteResponse:
							executeResponse as unknown as Prisma.JsonObject,
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

			return mapPaymentToResponse(updatedPayment);
		} else {
			await prisma.payment.update({
				where: { id: payment.id },
				data: { status: PaymentStatus.FAILED },
			});

			throw new AppError(httpStatus.BAD_REQUEST, "Payment execution failed");
		}
	} else {
		await prisma.payment.update({
			where: { id: payment.id },
			data: { status: PaymentStatus.FAILED },
		});

		throw new AppError(httpStatus.BAD_REQUEST, `Payment ${status}`);
	}
};

const getPaymentStatus = async (
	applicationId: string,
	tenantId: string,
): Promise<IBkashPaymentResponse> => {
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
): Promise<IBkashPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { id: paymentId, deletedAt: null },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	return mapPaymentToResponse(payment);
};

const queryPaymentStatus = async (
	bkashPaymentId: string,
): Promise<IBkashPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { bkashPaymentId, deletedAt: null },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const queryResponse = await queryBkashPayment({ paymentId: bkashPaymentId });

	let newStatus = payment.status;
	if (queryResponse.transactionStatus === "Completed") {
		newStatus = PaymentStatus.COMPLETED;
	} else if (queryResponse.transactionStatus === "Failed") {
		newStatus = PaymentStatus.FAILED;
	}

	if (newStatus !== payment.status) {
		const updatedPayment = await prisma.payment.update({
			where: { id: payment.id },
			data: { status: newStatus },
		});
		return mapPaymentToResponse(updatedPayment);
	}

	return mapPaymentToResponse(payment);
};

const refundPayment = async (
	payload: IBkashRefundPayload,
): Promise<IBkashPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { bkashPaymentId: payload.paymentId, deletedAt: null },
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

	const refundResponse = await refundBkashPayment({
		paymentId: payload.paymentId,
		amount: payload.amount,
		currency: payload.currency,
		invoiceNumber: payload.invoiceNumber,
		reason: payload.reason,
	});

	if (refundResponse.refundStatus === "Completed") {
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
	handleBkashCallback,
	getPaymentStatus,
	getPaymentById,
	queryPaymentStatus,
	refundPayment,
};
