import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import type { SignOptions } from "jsonwebtoken";
import path from "node:path";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterUserPayload,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import {
	type Role,
	UserStatus,
	AuthProvider,
} from "../../../generated/prisma/client";

const generateOTP = (): string => {
	return crypto.randomInt(100000, 1000000).toString();
};

const createTokens = (
	userId: string,
	email: string,
	name: string,
	role: Role,
) => {
	const accessToken = jwtUtils.createToken(
		{ userId, email, name, role },
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions["expiresIn"],
	);

	const refreshToken = jwtUtils.createToken(
		{ userId, email, name, role },
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions["expiresIn"],
	);

	return { accessToken, refreshToken };
};

const hashPassword = async (password: string): Promise<string> => {
	const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
	return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	return bcrypt.compare(password, hashedPassword);
};

const sendOTPEmail = async (
	email: string,
	name: string,
	otp: string,
	expirationMinutes: number,
	templateName: string,
	subject: string,
) => {
	const templatePath = path.join(
		process.cwd(),
		"src/app/templates",
		templateName,
	);
	const templateData = {
		name,
		otp,
		expirationMinutes,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject,
		html,
	});
};

const sendWelcomeEmail = async (email: string, name: string) => {
	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/welcome-email.ejs",
	);
	const templateData = {
		name,
		frontendUrl: config.frontend_url,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Welcome to Housing & Roommate Platform!",
		html,
	});
};

const sendPasswordResetSuccessEmail = async (email: string, name: string) => {
	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/reset-password-success.ejs",
	);
	const templateData = {
		name,
		frontendUrl: config.frontend_url,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Your Password Has Been Changed",
		html,
	});
};

const registerUser = async (
	payload: IRegisterUserPayload,
): Promise<{ message: string }> => {
	const email = payload.email.trim().toLowerCase();

	const existingUser = await prisma.user.findUnique({
		where: { email },
	});

	if (existingUser) {
		throw new AppError(httpStatus.CONFLICT, "Email already registered");
	}

	const hashedPassword = await hashPassword(payload.password);
	const otp = generateOTP();
	const expirationSeconds = 5 * 60;

	const otpKey = `registration-otp:${email}`;
	await redisClient.set(otpKey, otp, { EX: expirationSeconds });

	const registrationDataKey = `registration-data:${email}`;
	const registrationData = {
		name: payload.name,
		email,
		password: hashedPassword,
		role: payload.role || "TENANT",
		profile: payload.profile,
	};
	await redisClient.set(registrationDataKey, JSON.stringify(registrationData), {
		EX: expirationSeconds,
	});

	await sendOTPEmail(
		email,
		payload.name,
		otp,
		expirationSeconds / 60,
		"registration-user-otp.ejs",
		"Verify Your Email - Housing & Roommate Platform",
	);

	return {
		message:
			"Registration successful. Please verify your email with the OTP sent.",
	};
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const email = payload.email.trim().toLowerCase();
	const otp = payload.otp;

	const otpKey = `registration-otp:${email}`;
	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const registrationDataKey = `registration-data:${email}`;
	const redisUserData = await redisClient.get(registrationDataKey);

	if (!redisUserData) {
		throw new AppError(httpStatus.NOT_FOUND, "Registration data not found");
	}

	const userData = JSON.parse(redisUserData) as {
		name: string;
		email: string;
		password: string;
		role: Role;
		profile?: {
			phoneNumber?: string;
			bio?: string;
			avatarUrl?: string;
		};
	};

	const createdUser = await prisma.user.create({
		data: {
			email: userData.email,
			password: userData.password,
			name: userData.name,
			role: userData.role,
			emailVerified: true,
			profile: userData.profile
				? {
						create: {
							phoneNumber: userData.profile.phoneNumber,
							bio: userData.profile.bio,
							avatarUrl: userData.profile.avatarUrl,
						},
					}
				: undefined,
		},
	});

	await redisClient.del([otpKey, registrationDataKey]);

	await sendWelcomeEmail(createdUser.email, createdUser.name);

	const { accessToken, refreshToken } = createTokens(
		createdUser.id,
		createdUser.email,
		createdUser.name,
		createdUser.role,
	);

	await prisma.user.update({
		where: { id: createdUser.id },
		data: { refreshToken },
	});

	return {
		accessToken,
		refreshToken,
		user: {
			id: createdUser.id,
			email: createdUser.email,
			name: createdUser.name,
			role: createdUser.role,
			emailVerified: true,
		},
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been blocked. Please contact support.",
		);
	}

	if (user.deletedAt) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	if (!user.password && user.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created with Google. Please login with Google.",
		);
	}

	if (!user.password) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	const isPasswordValid = await comparePassword(
		payload.password,
		user.password,
	);

	if (!isPasswordValid) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	const { accessToken, refreshToken } = createTokens(
		user.id,
		user.email,
		user.name,
		user.role,
	);

	await prisma.user.update({
		where: { id: user.id },
		data: { refreshToken },
	});

	return { accessToken, refreshToken };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googlePayload: { email: string; name: string; sub: string } | null = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});
		googlePayload = ticket.getPayload() as {
			email: string;
			name: string;
			sub: string;
		} | null;
	} catch (error) {
		console.error("Google ID token verification failed:", error);
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID token",
		);
	}

	if (!googlePayload) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID token",
		);
	}

	if (!googlePayload.email) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google email not found");
	}
	if (!googlePayload.name) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google user name not found");
	}

	const email = googlePayload.email.trim().toLowerCase();

	let user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		user = await prisma.user.create({
			data: {
				email,
				password: await hashPassword(crypto.randomBytes(16).toString("hex")),
				name: googlePayload.name,
				role: "TENANT",
				authProvider: AuthProvider.GOOGLE,
				googleId: googlePayload.sub,
				emailVerified: true,
			},
		});

		await sendWelcomeEmail(user.email, user.name);
	} else {
		if (user.status === UserStatus.BLOCKED) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been blocked. Please contact support.",
			);
		}

		if (user.deletedAt) {
			throw new AppError(httpStatus.UNAUTHORIZED, "Account not found");
		}

		if (user.authProvider === AuthProvider.CREDENTIAL) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					googleId: googlePayload.sub,
					authProvider: AuthProvider.GOOGLE,
				},
			});
		}
	}

	const { accessToken, refreshToken } = createTokens(
		user.id,
		user.email,
		user.name,
		user.role,
	);

	await prisma.user.update({
		where: { id: user.id },
		data: { refreshToken },
	});

	return { accessToken, refreshToken };
};

const forgotPassword = async (
	payload: IForgotPasswordPayload,
): Promise<{ message: string }> => {
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		return {
			message: "If the email exists, a password reset OTP has been sent",
		};
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been blocked. Please contact support.",
		);
	}

	if (!user.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
	}

	if (user.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created with Google. Please login with Google.",
		);
	}

	const otp = generateOTP();
	const expirationSeconds = 5 * 60;

	const otpKey = `forgot-password-otp:${email}`;
	await redisClient.set(otpKey, otp, { EX: expirationSeconds });

	await sendOTPEmail(
		email,
		user.name,
		otp,
		expirationSeconds / 60,
		"forgot-password.ejs",
		"Reset Your Password - Housing & Roommate Platform",
	);

	return { message: "If the email exists, a password reset OTP has been sent" };
};

const resetPassword = async (
	payload: IResetPasswordPayload,
): Promise<{ message: string }> => {
	const email = payload.email.trim().toLowerCase();
	const otp = payload.otp;

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been blocked. Please contact support.",
		);
	}

	if (!user.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
	}

	if (user.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created with Google. Please login with Google.",
		);
	}

	const otpKey = `forgot-password-otp:${email}`;
	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const hashedPassword = await hashPassword(payload.newPassword);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			password: hashedPassword,
			refreshToken: null,
		},
	});

	await redisClient.del(otpKey);

	await sendPasswordResetSuccessEmail(user.email, user.name);

	return { message: "Password reset successful" };
};

const refreshToken = async (refreshToken: string) => {
	const verifiedToken = jwtUtils.verifyToken(
		refreshToken,
		config.jwt_refresh_secret,
	);

	if (!verifiedToken.success) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired refresh token",
		);
	}

	const { userId } = verifiedToken.data as {
		userId: string;
		email: string;
		name: string;
		role: Role;
	};

	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user || user.refreshToken !== refreshToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
	}

	if (user.status === UserStatus.BLOCKED || user.deletedAt) {
		throw new AppError(httpStatus.FORBIDDEN, "Account is blocked or deleted");
	}

	const { accessToken, refreshToken: newRefreshToken } = createTokens(
		user.id,
		user.email,
		user.name,
		user.role,
	);

	await prisma.user.update({
		where: { id: user.id },
		data: { refreshToken: newRefreshToken },
	});

	return { accessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (userId: string): Promise<{ message: string }> => {
	await prisma.user.update({
		where: { id: userId },
		data: { refreshToken: null },
	});

	return { message: "Logged out successfully" };
};

const getMe = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { profile: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		emailVerified: user.emailVerified,
		status: user.status,
		authProvider: user.authProvider,
		profile: user.profile
			? {
					phoneNumber: user.profile.phoneNumber,
					bio: user.profile.bio,
					avatarUrl: user.profile.avatarUrl,
				}
			: null,
	};
};

export const AuthService = {
	registerUser,
	verifyEmail,
	loginUser,
	googleLogin,
	forgotPassword,
	resetPassword,
	refreshToken,
	logoutUser,
	getMe,
};
