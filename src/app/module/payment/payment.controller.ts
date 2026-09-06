import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";
import { AppError } from "../../utils/AppError";
import type { IBkashRefundPayload } from "./payment.interface";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

	const result = await PaymentService.initiatePayment(
		req.user.userId,
		req.body,
		idempotencyKey,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "bKash payment initiated successfully",
		data: result,
	});
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
	const { paymentId, status } = req.body;
	const signature = req.headers["x-bkash-signature"] as string | undefined;

	if (!paymentId || !status) {
		throw new AppError(httpStatus.BAD_REQUEST, "Missing paymentId or status");
	}

	const result = await PaymentService.handleBkashCallback(
		paymentId,
		status,
		signature,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "bKash payment callback processed successfully",
		data: result,
	});
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { applicationId } = req.params as { applicationId: string };

	const result = await PaymentService.getPaymentStatus(
		applicationId,
		req.user.userId,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Payment status retrieved successfully",
		data: result,
	});
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { id } = req.params as { id: string };

	const result = await PaymentService.getPaymentById(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Payment retrieved successfully",
		data: result,
	});
});

const queryPaymentStatus = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { bkashPaymentId } = req.params as { bkashPaymentId: string };

	const result = await PaymentService.queryPaymentStatus(bkashPaymentId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Payment status queried successfully",
		data: result,
	});
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const payload = req.body as IBkashRefundPayload;

	const result = await PaymentService.refundPayment(payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Payment refunded successfully",
		data: result,
	});
});

export const PaymentController = {
	initiatePayment,
	bkashCallback,
	getPaymentStatus,
	getPaymentById,
	queryPaymentStatus,
	refundPayment,
};
