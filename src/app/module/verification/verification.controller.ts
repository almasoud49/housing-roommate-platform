import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { VerificationService } from "./verification.service";
import type {
	IUploadVerificationDocsPayload,
	IVerificationReviewPayload,
} from "./verification.interface";

const uploadVerificationDocs = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;
		const payload = req.body as IUploadVerificationDocsPayload;

		const result = await VerificationService.uploadVerificationDocs(
			userId,
			payload,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message:
				"Verification documents uploaded successfully. Awaiting admin review.",
			data: result,
		});
	},
);

const getMyVerificationStatus = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;

		const result = await VerificationService.getMyVerificationStatus(userId);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Verification status retrieved",
			data: result,
		});
	},
);

const getPendingVerifications = catchAsync(
	async (req: Request, res: Response) => {
		const filters = {
			status: (req.query.status as string) || undefined,
			isVerified: req.query.isVerified
				? req.query.isVerified === "true"
				: undefined,
			search: (req.query.search as string) || undefined,
			page: req.query.page ? parseInt(req.query.page as string) : 1,
			limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
			sortBy: (req.query.sortBy as string) || "createdAt",
			sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
		};

		const result = await VerificationService.getPendingVerifications(filters);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Pending verifications retrieved",
			data: result.data,
			meta: result.meta,
		});
	},
);

const reviewVerification = catchAsync(async (req: Request, res: Response) => {
	const adminId = req.user!.userId;
	const payload = req.body as IVerificationReviewPayload;

	const result = await VerificationService.reviewVerification(adminId, payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: `Verification ${payload.action.toLowerCase()}d`,
		data: result,
	});
});

export const VerificationController = {
	uploadVerificationDocs,
	getMyVerificationStatus,
	getPendingVerifications,
	reviewVerification,
};
