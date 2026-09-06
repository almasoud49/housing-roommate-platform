import { z } from "zod";
import { Role } from "../../../generated/prisma/client";

const registerSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name too long"),
	email: z.email("Invalid email format"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	role: z
		.enum([Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER])
		.optional()
		.default(Role.TENANT),
	profile: z
		.object({
			phoneNumber: z.string().optional(),
			bio: z.string().optional(),
			avatarUrl: z.url("Invalid avatar URL").optional(),
		})
		.optional(),
});

const loginSchema = z.object({
	email: z.email("Invalid email format"),
	password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
	email: z.email("Invalid email format"),
	otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

const googleLoginSchema = z.object({
	idToken: z.string().min(1, "ID token is required"),
});

const forgotPasswordSchema = z.object({
	email: z.email("Invalid email format"),
});

const resetPasswordSchema = z.object({
	email: z.email("Invalid email format"),
	newPassword: z.string().min(6, "Password must be at least 6 characters"),
	otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

export const AuthValidation = {
	registerSchema,
	loginSchema,
	verifyEmailSchema,
	googleLoginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	refreshTokenSchema,
};
