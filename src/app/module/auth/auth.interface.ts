import type { Role } from "../../../generated/prisma/client";
import type {
	UserStatus,
	AuthProvider,
} from "../../../generated/prisma/client";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
	role?: Role;
	profile?: {
		phoneNumber?: string;
		bio?: string;
		avatarUrl?: string;
	};
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}

export interface IRefreshTokenPayload {
	refreshToken: string;
}

export interface ILoginResponse {
	accessToken: string;
	refreshToken: string;
}

export interface IRegisterResponse {
	message: string;
}

export interface IVerifyEmailResponse {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		name: string;
		role: Role;
		emailVerified: boolean;
	};
}

export interface IGetMeResponse {
	id: string;
	email: string;
	name: string;
	role: Role;
	emailVerified: boolean;
	status: UserStatus;
	authProvider: AuthProvider;
	profile?: {
		phoneNumber: string | null;
		bio: string | null;
		avatarUrl: string | null;
	} | null;
}
