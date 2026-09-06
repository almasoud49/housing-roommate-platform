import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IUploadVerificationDocsPayload,
	IVerificationReviewPayload,
} from "./verification.interface";
import type { Prisma } from "../../../generated/prisma/client";

const uploadVerificationDocs = async (
	userId: string,
	payload: IUploadVerificationDocsPayload,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.isVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "Already verified");
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			verificationDocs: payload.documents,
		},
	});

	// Notify admins
	const admins = await prisma.user.findMany({
		where: { role: "ADMIN", status: "ACTIVE" },
		select: { id: true },
	});

	await prisma.notification.createMany({
		data: admins.map((admin) => ({
			userId: admin.id,
			type: "SYSTEM_ANNOUNCEMENT",
			title: "New Verification Request",
			message: `${user.name} has submitted verification documents for review.`,
			data: { userId, type: "VERIFICATION_REQUEST" },
		})),
	});

	return {
		userId: updatedUser.id,
		isVerified: updatedUser.isVerified,
		verificationDocs: updatedUser.verificationDocs,
	};
};

const getMyVerificationStatus = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			name: true,
			isVerified: true,
			verificationDocs: true,
			status: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return user;
};

const getPendingVerifications = async (filters: {
	status?: string;
	isVerified?: boolean;
	search?: string;
	page: number;
	limit: number;
	sortBy: string;
	sortOrder: "asc" | "desc";
}) => {
	const { status, isVerified, search, page, limit, sortBy, sortOrder } =
		filters;

	const andConditions: Prisma.UserWhereInput[] = [
		{ role: "TENANT" },
		{ deletedAt: null },
	];

	if (status) {
		andConditions.push({ status: status as "ACTIVE" | "BLOCKED" });
	}

	if (isVerified !== undefined) {
		andConditions.push({ isVerified });
	}

	if (search) {
		andConditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			],
		});
	}

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where: { AND: andConditions },
			select: {
				id: true,
				email: true,
				name: true,
				isVerified: true,
				verificationDocs: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.user.count({
			where: { AND: andConditions },
		}),
	]);

	return {
		data: users,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const reviewVerification = async (
	adminId: string,
	payload: IVerificationReviewPayload,
) => {
	const user = await prisma.user.findUnique({
		where: { id: payload.userId },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.role !== "TENANT") {
		throw new AppError(httpStatus.BAD_REQUEST, "Only tenants can be verified");
	}

	const updatedUser = await prisma.user.update({
		where: { id: payload.userId },
		data: {
			isVerified: payload.action === "APPROVE",
		},
	});

	// Create audit log
	await prisma.auditLog.create({
		data: {
			userId: adminId,
			action:
				payload.action === "APPROVE"
					? "VERIFICATION_APPROVED"
					: "VERIFICATION_REJECTED",
			entityType: "User",
			entityId: payload.userId,
			oldData: { isVerified: user.isVerified },
			newData: { isVerified: updatedUser.isVerified, notes: payload.notes },
		},
	});

	// Notify user
	await prisma.notification.create({
		data: {
			userId: payload.userId,
			type: "SYSTEM_ANNOUNCEMENT",
			title:
				payload.action === "APPROVE"
					? "Verification Approved"
					: "Verification Rejected",
			message:
				payload.action === "APPROVE"
					? "Your identity has been verified. You can now access all tenant features."
					: `Your verification was rejected. ${payload.notes || "Please contact support for details."}`,
			data: { action: payload.action, notes: payload.notes },
		},
	});

	return {
		userId: updatedUser.id,
		isVerified: updatedUser.isVerified,
	};
};

export const VerificationService = {
	uploadVerificationDocs,
	getMyVerificationStatus,
	getPendingVerifications,
	reviewVerification,
};
