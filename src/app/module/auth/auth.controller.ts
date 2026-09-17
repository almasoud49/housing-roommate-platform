import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { sendCreated, sendOk } from "../../utils/sendResponse";
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

	sendCreated(res, result.message, null);
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IVerifyEmailPayload;
	const result = await AuthService.verifyEmail(payload);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendOk(res, "Email verified successfully", {
		accessToken: result.accessToken,
		user: result.user,
	});
});

const login = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as ILoginUserPayload;
	const result = await AuthService.loginUser(payload);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendOk(res, "Login successful", { accessToken: result.accessToken });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IGoogleLoginPayload;
	const result = await AuthService.googleLogin(payload);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendOk(res, "Google login successful", { accessToken: result.accessToken });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IForgotPasswordPayload;
	const result = await AuthService.forgotPassword(payload);

	sendOk(res, result.message, null);
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IResetPasswordPayload;
	const result = await AuthService.resetPassword(payload);

	sendOk(res, result.message, null);
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
	const refreshToken = req.cookies.refreshToken;

	if (!refreshToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is required");
	}

	const result = await AuthService.refreshToken(refreshToken);

	jwtUtils.setAuthCookies(res, result.accessToken, result.refreshToken);

	sendOk(res, "Access token refreshed", { accessToken: result.accessToken });
});

const logout = catchAsync(async (req: Request, res: Response) => {
	if (req.user?.userId) {
		await AuthService.logoutUser(req.user.userId);
	}

	jwtUtils.clearAuthCookies(res);

	sendOk(res, "Logged out successfully", null);
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await AuthService.getMe(userId);

	sendOk(res, "User profile retrieved", result);
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
