import crypto from "crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import config from "../../config";
import type {
	IInitiatePaymentPayload,
	IBkashPaymentResponse,
	IBkashRefundPayload,
} from "./payment.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { redisClient } from "../../lib/redis";
import { PaymentStatus, RentStatus } from "../../../generated/prisma/client";
import { notifyRentPaid } from "../../utils/notification";

interface BkashTokenResponse {
	id_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
}

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

const BKASH_TOKEN_KEY = "bkash:access_token";
const BKASH_REFRESH_TOKEN_KEY = "bkash:refresh_token";

const getBkashAuthHeaders = async (): Promise<Record<string, string>> => {
	const now = Date.now();

	const [accessToken, accessTokenTTL, refreshToken] = await Promise.all([
		redisClient.get(BKASH_TOKEN_KEY),
		redisClient.ttl(BKASH_TOKEN_KEY),
		redisClient.get(BKASH_REFRESH_TOKEN_KEY),
	]);

	if (accessToken && accessTokenTTL > 600) {
		return {
			Authorization: accessToken,
			"X-APP-Key": config.bkash_app_key!,
		};
	}

	if (refreshToken && accessTokenTTL <= 600) {
		const refreshResponse = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
					refresh_token: refreshToken,
				}),
			},
		);

		if (!refreshResponse.ok) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				"Bkash Access Token Grant Failed",
			);
		}

		const refreshResult = await refreshResponse.json();
		const newAccessToken = refreshResult.id_token;

		await redisClient.set(BKASH_TOKEN_KEY, newAccessToken, {
			expiration: { type: "EX", value: 60 * 60 },
		});

		return {
			Authorization: newAccessToken,
			"X-APP-Key": config.bkash_app_key!,
		};
	}

	const credentials = `${config.bkash_username}:${config.bkash_password}`;
	const encodedCredentials = Buffer.from(credentials).toString("base64");

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/token/grant`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${encodedCredentials}`,
				"X-APP-Key": config.bkash_app_key!,
			},
			body: JSON.stringify({
				app_key: config.bkash_app_key,
				app_secret: config.bkash_app_secret,
			}),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(httpStatus.BAD_GATEWAY, `bKash token error: ${error}`);
	}

	const tokenData: BkashTokenResponse = await response.json();

	await Promise.all([
		redisClient.set(BKASH_TOKEN_KEY, tokenData.id_token, {
			expiration: { type: "EX", value: tokenData.expires_in - 60 },
		}),
		redisClient.set(BKASH_REFRESH_TOKEN_KEY, tokenData.refresh_token, {
			expiration: { type: "EX", value: 60 * 60 * 24 * 28 },
		}),
	]);

	return {
		Authorization: tokenData.id_token,
		"X-APP-Key": config.bkash_app_key!,
	};
};

const createBkashPayment = async (payload: {
	amount: number;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
}): Promise<BkashCreatePaymentResponse> => {
	const headers = await getBkashAuthHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers: {
				...headers,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				mode: "0011",
				payerReference: "",
				callbackURL: config.bkash_callback_url,
				amount: payload.amount.toString(),
				currency: payload.currency,
				intent: payload.intent,
				merchantInvoiceNumber: payload.merchantInvoiceNumber,
			}),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`bKash create payment error: ${error}`,
		);
	}

	return response.json();
};

const executeBkashPayment = async (
	paymentId: string,
): Promise<BkashExecutePaymentResponse> => {
	const headers = await getBkashAuthHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers: {
				...headers,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ paymentID: paymentId }),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`bKash execute payment error: ${error}`,
		);
	}

	return response.json();
};

const queryBkashPayment = async (
	paymentId: string,
): Promise<BkashQueryPaymentResponse> => {
	const headers = await getBkashAuthHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/payment/status`,
		{
			method: "POST",
			headers: {
				...headers,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ paymentID: paymentId }),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`bKash query payment error: ${error}`,
		);
	}

	return response.json();
};

const refundBkashPayment = async (payload: {
	paymentId: string;
	amount: number;
	currency: string;
	invoiceNumber: string;
	reason: string;
}): Promise<BkashRefundResponse> => {
	const headers = await getBkashAuthHeaders();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/refund`,
		{
			method: "POST",
			headers: {
				...headers,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				paymentID: payload.paymentId,
				amount: payload.amount.toString(),
				currency: payload.currency,
				invoiceNumber: payload.invoiceNumber,
				reason: payload.reason,
			}),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`bKash refund error: ${error}`,
		);
	}

	return response.json();
};

const verifyBkashSignature = (payload: string, signature: string): boolean => {
	const expectedSignature = crypto
		.createHmac("sha256", config.bkash_app_secret!)
		.update(payload)
		.digest("hex");

	return crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(expectedSignature),
	);
};

const mapPaymentToResponse = (payment: {
	id: string;
	applicationId: string;
	tenantId: string;
	amount: number;
	currency: string;
	status: string;
	bkashPaymentId: string | null;
	bkashCreateResponse: Prisma.JsonValue | null;
	bkashExecuteResponse: Prisma.JsonValue | null;
	createdAt: Date;
	updatedAt: Date;
}): IBkashPaymentResponse => {
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
		const existing = await redisClient.get(
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
			room: {
				include: {
					flat: {
						include: {
							building: {
								include: { property: true },
							},
						},
					},
				},
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
		where: { applicationId: payload.applicationId },
	});

	if (existingPayment) {
		if (idempotencyKey) {
			await redisClient.set(
				`payment:idempotency:${idempotencyKey}`,
				existingPayment.id,
				{
					expiration: { type: "EX", value: 60 * 60 * 24 },
				},
			);
		}
		return mapPaymentToResponse(existingPayment);
	}

	const merchantInvoiceNumber = `INV-${application.id.slice(0, 8)}-${Date.now()}`;
	const bkashCreateResponse = await createBkashPayment({
		amount: payload.amount,
		currency: payload.currency || "BDT",
		intent: "sale",
		merchantInvoiceNumber,
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
		await redisClient.set(`payment:idempotency:${idempotencyKey}`, payment.id, {
			expiration: { type: "EX", value: 60 * 60 * 24 },
		});
	}

	return mapPaymentToResponse(payment);
};

const handleBkashCallback = async (
	paymentId: string,
	status: string,
	signature?: string,
): Promise<IBkashPaymentResponse> => {
	const payment = await prisma.payment.findFirst({
		where: { bkashPaymentId: paymentId },
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
		const executeResponse = await executeBkashPayment(paymentId);

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
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId },
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
		where: { bkashPaymentId },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const queryResponse = await queryBkashPayment(bkashPaymentId);

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
		where: { bkashPaymentId: payload.paymentId },
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
