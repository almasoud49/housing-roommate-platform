import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { sendCreated, sendOk } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";
import { AppError } from "../../utils/AppError";
import type { IBkashRefundPayload } from "./payment.interface";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

	const result = await PaymentService.initiatePayment(
		userId,
		req.body,
		idempotencyKey,
	);

	sendCreated(res, "bKash payment initiated successfully", result);
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
	// bKash redirects via GET with ?paymentID=&status=&signature=,
	// while manual tests POST JSON { paymentId, status }
	const paymentId =
		req.body?.paymentId ??
		(req.query.paymentID as string | undefined) ??
		(req.query.paymentId as string | undefined);
	const status = req.body?.status ?? (req.query.status as string | undefined);
	// Only verify webhook-style signatures sent via header. bKash's redirect
	// `?signature=` query param is bKash-generated, not our HMAC, so it must
	// not be fed into verifyBkashSignature (it would never match). The live
	// `execute` call against bKash's API in the service is the real
	// verification for redirect callbacks.
	const signature = req.headers["x-bkash-signature"] as string | undefined;

	if (!paymentId || !status) {
		throw new AppError(httpStatus.BAD_REQUEST, "Missing paymentId or status");
	}

	const result = await PaymentService.handleBkashCallback(
		paymentId,
		status,
		signature,
	);

	sendOk(res, "bKash payment callback processed successfully", result);
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { applicationId } = req.params as { applicationId: string };

	const result = await PaymentService.getPaymentStatus(applicationId, userId);

	sendOk(res, "Payment status retrieved successfully", result);
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
	requireUserId(req);

	const { id } = req.params as { id: string };

	const result = await PaymentService.getPaymentById(id);

	sendOk(res, "Payment retrieved successfully", result);
});

const queryPaymentStatus = catchAsync(async (req: Request, res: Response) => {
	requireUserId(req);

	const { bkashPaymentId } = req.params as { bkashPaymentId: string };

	const result = await PaymentService.queryPaymentStatus(bkashPaymentId);

	sendOk(res, "Payment status queried successfully", result);
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
	requireUserId(req);

	const payload = req.body as IBkashRefundPayload;

	const result = await PaymentService.refundPayment(payload);

	sendOk(res, "Payment refunded successfully", result);
});

export const PaymentController = {
	initiatePayment,
	bkashCallback,
	getPaymentStatus,
	getPaymentById,
	queryPaymentStatus,
	refundPayment,
};
