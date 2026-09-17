import httpStatus from "http-status";
import type { Role } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IUpdateProfilePayload,
	IUserProfileResponse,
} from "./user.interface";

const mapProfile = (
	profile: {
		phoneNumber: string | null;
		bio: string | null;
		avatarUrl: string | null;
		preferences: string | null;
	} | null,
) => {
	if (!profile) return null;
	return {
		phoneNumber: profile.phoneNumber ?? undefined,
		bio: profile.bio ?? undefined,
		avatarUrl: profile.avatarUrl ?? undefined,
		preferences: profile.preferences ?? undefined,
	};
};

const mapUserResponse = (
	user: {
		id: string;
		email: string;
		name: string;
		role: Role;
		emailVerified: boolean;
		status: string;
		authProvider: string;
	},
	profile: IUserProfileResponse["profile"],
): IUserProfileResponse => ({
	id: user.id,
	email: user.email,
	name: user.name,
	role: user.role,
	emailVerified: user.emailVerified,
	status: user.status,
	authProvider: user.authProvider,
	profile,
});

const getMe = async (userId: string): Promise<IUserProfileResponse> => {
	const user = await prisma.user.findFirst({
		where: { id: userId, deletedAt: null },
		include: { profile: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return mapUserResponse(user, mapProfile(user.profile));
};

const updateProfile = async (
	userId: string,
	payload: IUpdateProfilePayload,
): Promise<IUserProfileResponse> => {
	const user = await prisma.user.findFirst({
		where: { id: userId, deletedAt: null },
		include: { profile: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const profileData = {
		phoneNumber: payload.phoneNumber,
		bio: payload.bio,
		avatarUrl: payload.avatarUrl,
		preferences: payload.preferences,
	};

	const updatedProfile = await prisma.profile.upsert({
		where: { userId },
		update: profileData,
		create: { userId, ...profileData },
	});

	return mapUserResponse(user, mapProfile(updatedProfile));
};

export const UserService = {
	getMe,
	updateProfile,
};
