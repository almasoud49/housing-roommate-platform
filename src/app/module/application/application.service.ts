import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateApplicationPayload,
	IUpdateApplicationStatusPayload,
	IApplicationFilters,
	IApplicationListResponse,
	IApplicationResponse,
} from "./application.interface";
import { ApplicationStatus } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";
import { applicationWithTenantAndRoomInclude } from "../../utils/includes";
import {
	buildPagination,
	buildOrderBy,
	buildMeta,
	applyFilters,
	buildSearchConditions,
} from "../../utils/query";
import {
	assertOwnership,
	assertNotDeleted,
	assertActiveRoom,
	getLandlordRooms,
} from "../../utils/auth";
import {
	notifyApplicationSubmitted,
	notifyApplicationAccepted,
	notifyApplicationRejected,
	notifyRoomBooked,
} from "../../utils/notification";

const createApplication = async (
	tenantId: string,
	payload: ICreateApplicationPayload,
): Promise<IApplicationResponse> => {
	const application = await prisma.$transaction(
		async (tx) => {
			const room = await tx.room.findUnique({
				where: { id: payload.roomId },
				include: {
					flat: {
						include: {
							building: {
								include: {
									property: true,
								},
							},
						},
					},
				},
			});

			if (!room) {
				throw new AppError(httpStatus.NOT_FOUND, "Room not found");
			}

			if (!room.isActive) {
				throw new AppError(httpStatus.BAD_REQUEST, "Room is not available");
			}

			const existingApplication = await tx.application.findUnique({
				where: {
					tenantId_roomId: {
						tenantId,
						roomId: payload.roomId,
					},
				},
			});

			if (existingApplication) {
				throw new AppError(
					httpStatus.CONFLICT,
					"You have already applied for this room",
				);
			}

			const newApplication = await tx.application.create({
				data: {
					tenantId,
					roomId: payload.roomId,
					status: ApplicationStatus.PENDING,
					message: payload.message,
				},
				include: applicationWithTenantAndRoomInclude,
			});

			await tx.notification.create({
				data: {
					userId: room.flat.building.property.landlordId,
					type: "APPLICATION_SUBMITTED",
					title: "New Application Received",
					message: `${newApplication.tenant.name} has applied for ${room.name}`,
					data: { applicationId: newApplication.id, roomId: room.id, tenantId },
				},
			});

			return newApplication;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	return application as IApplicationResponse;
};

const getMyApplications = async (
	tenantId: string,
	filters: IApplicationFilters,
): Promise<IApplicationListResponse> => {
	const {
		status,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const baseConditions: Prisma.ApplicationWhereInput[] = [{ tenantId }];

	const conditions = applyFilters(baseConditions, { status });

	const searchFields = ["message"];
	const searchCondition = buildSearchConditions(search, searchFields);
	if (searchCondition) {
		conditions.push({
			OR: [
				{ room: { name: { contains: search, mode: "insensitive" } } },
				{
					room: {
						flat: {
							building: { name: { contains: search, mode: "insensitive" } },
						},
					},
				},
				{
					room: {
						flat: {
							building: { address: { contains: search, mode: "insensitive" } },
						},
					},
				},
				{
					room: {
						flat: {
							building: { city: { contains: search, mode: "insensitive" } },
						},
					},
				},
				{ message: { contains: search, mode: "insensitive" } },
			],
		} as Prisma.ApplicationWhereInput);
	}

	const [applications, total] = await Promise.all([
		prisma.application.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: applicationWithTenantAndRoomInclude,
			...buildPagination(page, limit),
			orderBy: buildOrderBy(sortBy, sortOrder),
		}),
		prisma.application.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: applications as IApplicationResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getApplicationsForLandlord = async (
	landlordId: string,
	filters: IApplicationFilters,
): Promise<IApplicationListResponse> => {
	const {
		status,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const roomIds = await getLandlordRooms(landlordId);

	const baseConditions: Prisma.ApplicationWhereInput[] = [
		{ roomId: { in: roomIds } },
	];

	const conditions = applyFilters(baseConditions, { status });

	if (search) {
		conditions.push({
			OR: [
				{ tenant: { name: { contains: search, mode: "insensitive" } } },
				{ tenant: { email: { contains: search, mode: "insensitive" } } },
				{ room: { name: { contains: search, mode: "insensitive" } } },
				{
					room: {
						flat: {
							building: { name: { contains: search, mode: "insensitive" } },
						},
					},
				},
				{
					room: {
						flat: {
							building: { address: { contains: search, mode: "insensitive" } },
						},
					},
				},
				{
					room: {
						flat: {
							building: { city: { contains: search, mode: "insensitive" } },
						},
					},
				},
				{ message: { contains: search, mode: "insensitive" } },
			],
		} as Prisma.ApplicationWhereInput);
	}

	const [applications, total] = await Promise.all([
		prisma.application.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: applicationWithTenantAndRoomInclude,
			...buildPagination(page, limit),
			orderBy: buildOrderBy(sortBy, sortOrder),
		}),
		prisma.application.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: applications as IApplicationResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const updateApplicationStatus = async (
	applicationId: string,
	landlordId: string,
	payload: IUpdateApplicationStatusPayload,
): Promise<IApplicationResponse> => {
	const application = await prisma.application.findUnique({
		where: { id: applicationId },
		include: {
			room: {
				include: {
					flat: {
						include: {
							building: {
								include: {
									property: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found");
	}

	if (application.room.flat.building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update applications for your own properties",
		);
	}

	if (application.status !== ApplicationStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Application has already been processed",
		);
	}

	const updatedApplication = await prisma.$transaction(
		async (tx) => {
			const room = await tx.room.findUnique({
				where: { id: application.roomId },
			});

			if (!room) {
				throw new AppError(httpStatus.NOT_FOUND, "Room not found");
			}

			if (!room.isActive) {
				throw new AppError(httpStatus.CONFLICT, "Room is no longer available");
			}

			const updated = await tx.application.update({
				where: { id: applicationId },
				data: { status: payload.status },
				include: applicationWithTenantAndRoomInclude,
			});

			if (payload.status === ApplicationStatus.ACCEPTED) {
				const roomUpdateResult = await tx.room.updateMany({
					where: {
						id: application.roomId,
						isActive: true,
					},
					data: { isActive: false },
				});

				if (roomUpdateResult.count === 0) {
					throw new AppError(
						httpStatus.CONFLICT,
						"Room was booked by another application",
					);
				}

				await tx.application.updateMany({
					where: {
						roomId: application.roomId,
						id: { not: applicationId },
						status: ApplicationStatus.PENDING,
					},
					data: { status: ApplicationStatus.REJECTED },
				});

				await tx.notification.create({
					data: {
						userId: application.tenantId,
						type: "APPLICATION_ACCEPTED",
						title: "Application Accepted",
						message: `Your application for ${room.name} has been accepted!`,
						data: { applicationId, roomId: application.roomId },
					},
				});

				const rejectedApplications = await tx.application.findMany({
					where: {
						roomId: application.roomId,
						id: { not: applicationId },
						status: ApplicationStatus.REJECTED,
					},
					select: { tenantId: true },
				});

				await tx.notification.createMany({
					data: rejectedApplications.map((app) => ({
						userId: app.tenantId,
						type: "APPLICATION_REJECTED",
						title: "Application Rejected",
						message: `Your application for ${room.name} was rejected as the room has been booked.`,
						data: { roomId: application.roomId },
					})),
				});
			}

			if (payload.status === ApplicationStatus.REJECTED) {
				await tx.notification.create({
					data: {
						userId: application.tenantId,
						type: "APPLICATION_REJECTED",
						title: "Application Rejected",
						message: `Your application for ${room.name} has been rejected.`,
						data: { applicationId, roomId: application.roomId },
					},
				});
			}

			return updated;
		},
		{
			isolationLevel: "Serializable",
		},
	);

	return updatedApplication as IApplicationResponse;
};

const cancelApplication = async (
	applicationId: string,
	tenantId: string,
): Promise<void> => {
	const application = await prisma.application.findUnique({
		where: { id: applicationId },
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found");
	}

	if (application.tenantId !== tenantId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only cancel your own applications",
		);
	}

	if (application.status !== ApplicationStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Cannot cancel a processed application",
		);
	}

	await prisma.application.update({
		where: { id: applicationId },
		data: { status: ApplicationStatus.REJECTED },
	});
};

export const ApplicationService = {
	createApplication,
	getMyApplications,
	getApplicationsForLandlord,
	updateApplicationStatus,
	cancelApplication,
};
