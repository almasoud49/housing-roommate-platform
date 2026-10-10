import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { requireUser, requireUserId } from "../../utils/request";
import { sendCreated, sendOk } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";
import { AppError } from "../../utils/AppError";
import type { IRefundPayload, ISslcommerzCallbackParams } from "./payment.interface";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

	const result = await PaymentService.initiatePayment(
		userId,
		req.body,
		idempotencyKey,
	);

	sendCreated(res, "SSLCommerz payment initiated successfully", result);
});

// SSLCommerz redirects to the callback URL via GET with
// ?tran_id=&status=&val_id= (status is VALID | FAILED | CANCELLED).
// The service validates VALID payments server-to-server before completing.
const sslcommerzCallback = catchAsync(async (req: Request, res: Response) => {
	const tran_id = req.query.tran_id as string | undefined;
	const status = req.query.status as ISslcommerzCallbackParams["status"] | undefined;
	const val_id = req.query.val_id as string | undefined;

	if (!tran_id || !status) {
		throw new AppError(httpStatus.BAD_REQUEST, "Missing tran_id or status");
	}

	if (!["VALID", "FAILED", "CANCELLED"].includes(status)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid status");
	}

	const result = await PaymentService.handleSslcommerzCallback({
		tran_id,
		status,
		val_id,
	});

	sendOk(res, "SSLCommerz payment callback processed successfully", result);
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { applicationId } = req.params as { applicationId: string };

	const result = await PaymentService.getPaymentStatus(applicationId, userId);

	sendOk(res, "Payment status retrieved successfully", result);
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const { id } = req.params as { id: string };

	const result = await PaymentService.getPaymentById(
		id,
		user.userId,
		user.role,
	);

	sendOk(res, "Payment retrieved successfully", result);
});

const querySslcommerzStatus = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const { valId } = req.params as { valId: string };

	const result = await PaymentService.querySslcommerzStatus(
		valId,
		user.userId,
		user.role,
	);

	sendOk(res, "SSLCommerz payment status queried successfully", result);
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
	requireUserId(req);

	const payload = req.body as IRefundPayload;

	const result = await PaymentService.refundPayment(payload);

	sendOk(res, "Payment refunded successfully", result);
});

export const PaymentController = {
	initiatePayment,
	sslcommerzCallback,
	getPaymentStatus,
	getPaymentById,
	querySslcommerzStatus,
	refundPayment,
};
