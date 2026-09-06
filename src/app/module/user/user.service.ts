import httpStatus from "http-status";
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

const getMe = async (userId: string): Promise<IUserProfileResponse> => {
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
		profile: mapProfile(user.profile),
	};
};

const updateProfile = async (
	userId: string,
	payload: IUpdateProfilePayload,
): Promise<IUserProfileResponse> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { profile: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const updatedProfile = await prisma.profile.upsert({
		where: { userId },
		update: {
			phoneNumber: payload.phoneNumber,
			bio: payload.bio,
			avatarUrl: payload.avatarUrl,
			preferences: payload.preferences,
		},
		create: {
			userId,
			phoneNumber: payload.phoneNumber,
			bio: payload.bio,
			avatarUrl: payload.avatarUrl,
			preferences: payload.preferences,
		},
	});

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		emailVerified: user.emailVerified,
		status: user.status,
		authProvider: user.authProvider,
		profile: {
			phoneNumber: updatedProfile.phoneNumber ?? undefined,
			bio: updatedProfile.bio ?? undefined,
			avatarUrl: updatedProfile.avatarUrl ?? undefined,
			preferences: updatedProfile.preferences ?? undefined,
		},
	};
};

export const UserService = {
	getMe,
	updateProfile,
};
