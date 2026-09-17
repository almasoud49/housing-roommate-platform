import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { sendOk } from "../../utils/sendResponse";
import { UserService } from "./user.service";

const getMe = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await UserService.getMe(userId);

	sendOk(res, "User profile retrieved", result);
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await UserService.updateProfile(userId, req.body);

	sendOk(res, "Profile updated successfully", result);
});

export const UserController = {
	getMe,
	updateProfile,
};
