import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendCreated } from "../../utils/sendResponse";
import { UploadService } from "./upload.service";

const createSignature = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
	}

	const result = await UploadService.createSignature(req.user.userId, req.body);

	sendCreated(
		res,
		"Upload signature generated. Upload file directly to Cloudinary.",
		result,
	);
});

export const UploadController = {
	createSignature,
};
