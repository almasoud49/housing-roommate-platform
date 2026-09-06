import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";
import { AppError } from "../../utils/AppError";

const getMe = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await UserService.getMe(req.user.userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User profile retrieved",
		data: result,
	});
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await UserService.updateProfile(req.user.userId, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Profile updated successfully",
		data: result,
	});
});

export const UserController = {
	getMe,
	updateProfile,
};
