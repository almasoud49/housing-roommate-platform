import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendOk, sendPaginated } from "../../utils/sendResponse";
import { VerificationService } from "./verification.service";
import type {
	IUploadVerificationDocsPayload,
	IVerificationReviewPayload,
} from "./verification.interface";

const uploadVerificationDocs = catchAsync(
	async (req: Request, res: Response) => {
		const userId = requireUserId(req);
		const payload = req.body as IUploadVerificationDocsPayload;

		const result = await VerificationService.uploadVerificationDocs(
			userId,
			payload,
		);

		sendOk(
			res,
			"Verification documents uploaded successfully. Awaiting admin review.",
			result,
		);
	},
);

const getMyVerificationStatus = catchAsync(
	async (req: Request, res: Response) => {
		const userId = requireUserId(req);

		const result = await VerificationService.getMyVerificationStatus(userId);

		sendOk(res, "Verification status retrieved", result);
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
			...parseListParams(req.query),
		};

		const result = await VerificationService.getPendingVerifications(filters);

		sendPaginated(
			res,
			"Pending verifications retrieved",
			result.data,
			result.meta,
		);
	},
);

const reviewVerification = catchAsync(async (req: Request, res: Response) => {
	const adminId = requireUserId(req);
	const payload = req.body as IVerificationReviewPayload;

	const result = await VerificationService.reviewVerification(adminId, payload);

	sendOk(res, `Verification ${payload.action.toLowerCase()}d`, result);
});

export const VerificationController = {
	uploadVerificationDocs,
	getMyVerificationStatus,
	getPendingVerifications,
	reviewVerification,
};
