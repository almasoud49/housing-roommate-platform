import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateViewingPayload,
	IUpdateViewingStatusPayload,
	IViewingFilters,
	IViewingListResponse,
	IViewingResponse,
} from "./viewing.interface";
import { buildMeta } from "../../utils/query";

const tenantSelect = {
	id: true,
	name: true,
	email: true,
};

const roomSelect = {
	id: true,
	name: true,
	flatId: true,
};

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "NO_SHOW"];

const createRequest = async (
	tenantId: string,
	payload: ICreateViewingPayload,
): Promise<IViewingResponse> => {
	const room = await prisma.room.findUnique({
		where: { id: payload.roomId },
	});

	if (!room) {
		throw new AppError(httpStatus.NOT_FOUND, "Room not found");
	}

	if (new Date(payload.preferredDate).getTime() < Date.now()) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Preferred date must be in the future",
		);
	}

	const request = await prisma.propertyViewingRequest.create({
		data: {
			tenantId,
			roomId: payload.roomId,
			preferredDate: new Date(payload.preferredDate),
			preferredTime: payload.preferredTime,
			notes: payload.notes,
		},
		include: {
			tenant: { select: tenantSelect },
			room: { select: roomSelect },
		},
	});

	await prisma.notification.create({
		data: {
			userId: tenantId,
			type: "VIEWING_REQUESTED",
			title: "Viewing request submitted",
			message: `Your viewing request for room ${room.name} on ${payload.preferredDate} has been submitted`,
			data: { viewingRequestId: request.id, roomId: payload.roomId },
		},
	});

	return request as unknown as IViewingResponse;
};

const getRequests = async (
	filters: IViewingFilters,
): Promise<IViewingListResponse> => {
	const {
		status,
		roomId,
		tenantId,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.PropertyViewingRequestWhereInput[] = [];

	if (status) andConditions.push({ status });
	if (roomId) andConditions.push({ roomId });
	if (tenantId) andConditions.push({ tenantId });

	const where = andConditions.length > 0 ? { AND: andConditions } : undefined;

	const [requests, total] = await Promise.all([
		prisma.propertyViewingRequest.findMany({
			where,
			include: {
				tenant: { select: tenantSelect },
				room: { select: roomSelect },
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.propertyViewingRequest.count({ where }),
	]);

	return {
		data: requests as unknown as IViewingResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getRequestById = async (id: string): Promise<IViewingResponse> => {
	const request = await prisma.propertyViewingRequest.findUnique({
		where: { id },
		include: {
			tenant: { select: tenantSelect },
			room: { select: roomSelect },
		},
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Viewing request not found");
	}

	return request as unknown as IViewingResponse;
};

const updateRequestStatus = async (
	id: string,
	payload: IUpdateViewingStatusPayload,
): Promise<IViewingResponse> => {
	const request = await prisma.propertyViewingRequest.findUnique({
		where: { id },
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Viewing request not found");
	}

	if (TERMINAL_STATUSES.includes(request.status)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Request is already ${request.status} and cannot be changed`,
		);
	}

	if (
		request.status === "PENDING" &&
		payload.status !== "CONFIRMED" &&
		payload.status !== "CANCELLED"
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Pending requests can only be confirmed or cancelled",
		);
	}

	const updated = await prisma.propertyViewingRequest.update({
		where: { id },
		data: {
			status: payload.status,
			confirmedAt:
				payload.status === "CONFIRMED" ? new Date() : request.confirmedAt,
			completedAt:
				payload.status === "COMPLETED" ? new Date() : request.completedAt,
		},
		include: {
			tenant: { select: tenantSelect },
			room: { select: roomSelect },
		},
	});

	await prisma.notification.create({
		data: {
			userId: request.tenantId,
			type:
				payload.status === "CONFIRMED"
					? "VIEWING_CONFIRMED"
					: "VIEWING_CANCELLED",
			title: `Viewing request ${payload.status.toLowerCase().replace("_", " ")}`,
			message: `Your viewing request is now ${payload.status}`,
			data: { viewingRequestId: id },
		},
	});

	return updated as unknown as IViewingResponse;
};

const deleteRequest = async (
	id: string,
	userId: string,
	userRole: string,
): Promise<void> => {
	const request = await prisma.propertyViewingRequest.findUnique({
		where: { id },
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Viewing request not found");
	}

	const isOwner = request.tenantId === userId;
	const isAdmin = userRole === "ADMIN";

	if (!isOwner && !isAdmin) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete your own viewing requests",
		);
	}

	if (!isAdmin && request.status !== "PENDING") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending requests can be deleted",
		);
	}

	await prisma.propertyViewingRequest.delete({ where: { id } });
};

export const ViewingService = {
	createRequest,
	getRequests,
	getRequestById,
	updateRequestStatus,
	deleteRequest,
};
