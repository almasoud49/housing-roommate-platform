import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateMaintenancePayload,
	IMaintenanceFilters,
	IMaintenanceListResponse,
	IMaintenanceResponse,
	IUpdateMaintenancePayload,
	IUpdateMaintenanceStatusPayload,
} from "./maintenance.interface";
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

const createRequest = async (
	tenantId: string,
	payload: ICreateMaintenancePayload,
): Promise<IMaintenanceResponse> => {
	const room = await prisma.room.findUnique({
		where: { id: payload.roomId },
	});

	if (!room) {
		throw new AppError(httpStatus.NOT_FOUND, "Room not found");
	}

	const request = await prisma.maintenanceRequest.create({
		data: {
			tenantId,
			roomId: payload.roomId,
			title: payload.title,
			description: payload.description,
			category: payload.category,
			priority: payload.priority ?? "MEDIUM",
			images: payload.images ?? [],
			estimatedCost: payload.estimatedCost,
			scheduledAt: payload.scheduledAt
				? new Date(payload.scheduledAt)
				: undefined,
		},
		include: {
			tenant: { select: tenantSelect },
			room: { select: roomSelect },
		},
	});

	await prisma.notification.create({
		data: {
			userId: tenantId,
			type: "MAINTENANCE_CREATED",
			title: "Maintenance request created",
			message: `Your maintenance request "${payload.title}" has been submitted`,
			data: { maintenanceRequestId: request.id, roomId: payload.roomId },
		},
	});

	return request as unknown as IMaintenanceResponse;
};

const getRequests = async (
	filters: IMaintenanceFilters,
): Promise<IMaintenanceListResponse> => {
	const {
		status,
		priority,
		category,
		roomId,
		tenantId,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.MaintenanceRequestWhereInput[] = [];

	if (status) andConditions.push({ status });
	if (priority) andConditions.push({ priority });
	if (category) andConditions.push({ category });
	if (roomId) andConditions.push({ roomId });
	if (tenantId) andConditions.push({ tenantId });

	if (search) {
		andConditions.push({
			OR: [
				{ title: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
				{ category: { contains: search, mode: "insensitive" } },
			],
		});
	}

	const where = andConditions.length > 0 ? { AND: andConditions } : undefined;

	const [requests, total] = await Promise.all([
		prisma.maintenanceRequest.findMany({
			where,
			include: {
				tenant: { select: tenantSelect },
				room: { select: roomSelect },
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.maintenanceRequest.count({ where }),
	]);

	return {
		data: requests as unknown as IMaintenanceResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getRequestById = async (id: string): Promise<IMaintenanceResponse> => {
	const request = await prisma.maintenanceRequest.findUnique({
		where: { id },
		include: {
			tenant: { select: tenantSelect },
			room: { select: roomSelect },
		},
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Maintenance request not found");
	}

	return request as unknown as IMaintenanceResponse;
};

const updateRequest = async (
	id: string,
	userId: string,
	userRole: string,
	payload: IUpdateMaintenancePayload,
): Promise<IMaintenanceResponse> => {
	const request = await prisma.maintenanceRequest.findUnique({
		where: { id },
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Maintenance request not found");
	}

	const isOwner = request.tenantId === userId;
	const isStaff = ["LANDLORD", "PROPERTY_MANAGER", "ADMIN"].includes(userRole);

	if (!isOwner && !isStaff) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update your own maintenance requests",
		);
	}

	if (request.status === "CLOSED") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Closed requests cannot be updated",
		);
	}

	const updated = await prisma.maintenanceRequest.update({
		where: { id },
		data: {
			...payload,
			scheduledAt: payload.scheduledAt
				? new Date(payload.scheduledAt)
				: undefined,
		},
		include: {
			tenant: { select: tenantSelect },
			room: { select: roomSelect },
		},
	});

	return updated as unknown as IMaintenanceResponse;
};

const updateRequestStatus = async (
	id: string,
	payload: IUpdateMaintenanceStatusPayload,
): Promise<IMaintenanceResponse> => {
	const request = await prisma.maintenanceRequest.findUnique({
		where: { id },
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Maintenance request not found");
	}

	if (request.status === "CLOSED") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Closed requests cannot be updated",
		);
	}

	const updated = await prisma.maintenanceRequest.update({
		where: { id },
		data: {
			status: payload.status,
			completedAt:
				payload.status === "RESOLVED" || payload.status === "CLOSED"
					? new Date()
					: request.completedAt,
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
				payload.status === "RESOLVED"
					? "MAINTENANCE_RESOLVED"
					: "MAINTENANCE_UPDATED",
			title: `Maintenance request ${payload.status.toLowerCase().replace("_", " ")}`,
			message: `Your maintenance request "${request.title}" is now ${payload.status}`,
			data: { maintenanceRequestId: id },
		},
	});

	return updated as unknown as IMaintenanceResponse;
};

const deleteRequest = async (
	id: string,
	userId: string,
	userRole: string,
): Promise<void> => {
	const request = await prisma.maintenanceRequest.findUnique({
		where: { id },
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Maintenance request not found");
	}

	const isOwner = request.tenantId === userId;
	const isAdmin = userRole === "ADMIN";

	if (!isOwner && !isAdmin) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete your own maintenance requests",
		);
	}

	if (!isAdmin && request.status !== "OPEN") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only open requests can be deleted",
		);
	}

	await prisma.maintenanceRequest.delete({ where: { id } });
};

export const MaintenanceService = {
	createRequest,
	getRequests,
	getRequestById,
	updateRequest,
	updateRequestStatus,
	deleteRequest,
};
