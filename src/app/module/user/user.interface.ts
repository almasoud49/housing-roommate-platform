import type { Role } from "../../../generated/prisma/client";

export interface IUpdateProfilePayload {
	phoneNumber?: string;
	bio?: string;
	avatarUrl?: string;
	preferences?: string;
}

export interface IUserProfileResponse {
	id: string;
	email: string;
	name: string;
	role: Role;
	emailVerified: boolean;
	status: string;
	authProvider: string;
	profile: {
		phoneNumber?: string;
		bio?: string;
		avatarUrl?: string;
		preferences?: string;
	} | null;
}
