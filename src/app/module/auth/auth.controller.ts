import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
	ILoginUserPayload,
	IRegisterUserPayload,
	IVerifyEmailPayload,
	IGoogleLoginPayload,
	IForgotPasswordPayload,
	IResetPasswordPayload,
} from "./auth.interface";

const register = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IRegisterUserPayload;
	const result = await AuthService.registerUser(payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: result.message,
		data: null,
	});
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IVerifyEmailPayload;
	const result = await AuthService.verifyEmail(payload);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Email verified successfully",
		data: {
			accessToken: result.accessToken,
			user: result.user,
		},
	});
});

const login = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as ILoginUserPayload;
	const result = await AuthService.loginUser(payload);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Login successful",
		data: { accessToken: result.accessToken },
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IGoogleLoginPayload;
	const result = await AuthService.googleLogin(payload);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Google login successful",
		data: { accessToken: result.accessToken },
	});
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IForgotPasswordPayload;
	const result = await AuthService.forgotPassword(payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: result.message,
		data: null,
	});
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IResetPasswordPayload;
	const result = await AuthService.resetPassword(payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: result.message,
		data: null,
	});
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
	const refreshToken = req.cookies.refreshToken;

	if (!refreshToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is required");
	}

	const result = await AuthService.refreshToken(refreshToken);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Access token refreshed",
		data: { accessToken: result.accessToken },
	});
});

const logout = catchAsync(async (req: Request, res: Response) => {
	if (req.user?.userId) {
		await AuthService.logoutUser(req.user.userId);
	}

	jwtUtils.clearAuthCookies(res);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Logged out successfully",
		data: null,
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await AuthService.getMe(req.user.userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User profile retrieved",
		data: result,
	});
});

export const AuthController = {
	register,
	verifyEmail,
	login,
	googleLogin,
	forgotPassword,
	resetPassword,
	refreshAccessToken,
	logout,
	getMe,
};
