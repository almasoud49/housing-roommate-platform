import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateRoomPayload,
	IUpdateRoomPayload,
	IRoomFilters,
	IRoomListResponse,
	IRoomResponse,
} from "./room.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { roomWithFlatBuildingPropertyInclude } from "../../utils/includes";
import {
	buildPagination,
	buildOrderBy,
	buildMeta,
	buildSearchConditions,
	applyFilters,
	buildDateRangeFilter,
	buildNumberRangeFilter,
} from "../../utils/query";
import { assertNotDeleted, assertOwnership } from "../../utils/auth";

const createRoom = async (
	landlordId: string,
	payload: ICreateRoomPayload,
): Promise<IRoomResponse> => {
	const flat = await prisma.flat.findUnique({
		where: { id: payload.flatId },
		include: {
			building: {
				include: {
					property: true,
				},
			},
		},
	});

	if (!flat) {
		throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
	}

	if (flat.building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only add rooms to your own properties",
		);
	}

	const room = await prisma.room.create({
		data: {
			flatId: payload.flatId,
			name: payload.name,
			price: payload.price,
			availableFrom: payload.availableFrom
				? new Date(payload.availableFrom)
				: null,
			availableTo: payload.availableTo ? new Date(payload.availableTo) : null,
			isActive: payload.isActive ?? true,
		},
		include: roomWithFlatBuildingPropertyInclude,
	});

	return room as IRoomResponse;
};

const getRooms = async (filters: IRoomFilters): Promise<IRoomListResponse> => {
	const {
		flatId,
		isActive,
		availableFrom,
		availableTo,
		minPrice,
		maxPrice,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const conditions: Prisma.RoomWhereInput[] = [];

	if (flatId) {
		conditions.push({ flatId });
	}

	if (isActive !== undefined) {
		conditions.push({ isActive });
	}

	const availableFromFilter = buildDateRangeFilter(
		"availableFrom",
		availableFrom,
	);
	if (availableFromFilter) {
		conditions.push(availableFromFilter as Prisma.RoomWhereInput);
	}

	const availableToFilter = buildDateRangeFilter(
		"availableTo",
		undefined,
		availableTo,
	);
	if (availableToFilter) {
		conditions.push(availableToFilter as Prisma.RoomWhereInput);
	}

	const priceFilter = buildNumberRangeFilter("price", minPrice, maxPrice);
	if (priceFilter) {
		conditions.push(priceFilter as Prisma.RoomWhereInput);
	}

	const searchFields = ["name"];
	const searchCondition = buildSearchConditions(
		search,
		searchFields,
		"insensitive",
	);
	if (searchCondition) {
		conditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{
					flat: {
						building: { name: { contains: search, mode: "insensitive" } },
					},
				},
				{
					flat: {
						building: { address: { contains: search, mode: "insensitive" } },
					},
				},
				{
					flat: {
						building: { city: { contains: search, mode: "insensitive" } },
					},
				},
			],
		} as Prisma.RoomWhereInput);
	}

	const [rooms, total] = await Promise.all([
		prisma.room.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: roomWithFlatBuildingPropertyInclude,
			...buildPagination(page, limit),
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.room.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: rooms as IRoomResponse[],
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

const getRoomById = async (id: string): Promise<IRoomResponse> => {
	const room = await prisma.room.findUnique({
		where: { id },
		include: roomWithFlatBuildingPropertyInclude,
	});

	if (!room) {
		throw new AppError(httpStatus.NOT_FOUND, "Room not found");
	}

	return room as IRoomResponse;
};

const updateRoom = async (
	id: string,
	landlordId: string,
	payload: IUpdateRoomPayload,
): Promise<IRoomResponse> => {
	const room = await prisma.room.findUnique({
		where: { id },
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

	if (room.flat.building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update rooms in your own properties",
		);
	}

	const updateData: Prisma.RoomUpdateInput = { ...payload };
	if (payload.availableFrom)
		updateData.availableFrom = new Date(payload.availableFrom);
	if (payload.availableTo)
		updateData.availableTo = new Date(payload.availableTo);

	const updatedRoom = await prisma.room.update({
		where: { id },
		data: updateData,
		include: roomWithFlatBuildingPropertyInclude,
	});

	return updatedRoom as IRoomResponse;
};

const deleteRoom = async (id: string, landlordId: string): Promise<void> => {
	const room = await prisma.room.findUnique({
		where: { id },
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

	if (room.flat.building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete rooms in your own properties",
		);
	}

	await prisma.room.delete({ where: { id } });
};

const getMyRooms = async (
	landlordId: string,
	filters: IRoomFilters,
): Promise<IRoomListResponse> => {
	const buildings = await prisma.building.findMany({
		where: { property: { landlordId, deletedAt: null } },
		select: { id: true },
	});

	const buildingIds = buildings.map((b) => b.id);

	const flats = await prisma.flat.findMany({
		where: { buildingId: { in: buildingIds }, deletedAt: null },
		select: { id: true },
	});

	const flatIds = flats.map((f) => f.id);

	const {
		isActive,
		availableFrom,
		availableTo,
		minPrice,
		maxPrice,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const conditions: Prisma.RoomWhereInput[] = [{ flatId: { in: flatIds } }];

	if (isActive !== undefined) {
		conditions.push({ isActive });
	}

	const availableFromFilter = buildDateRangeFilter(
		"availableFrom",
		availableFrom,
	);
	if (availableFromFilter) {
		conditions.push(availableFromFilter as Prisma.RoomWhereInput);
	}

	const availableToFilter = buildDateRangeFilter(
		"availableTo",
		undefined,
		availableTo,
	);
	if (availableToFilter) {
		conditions.push(availableToFilter as Prisma.RoomWhereInput);
	}

	const priceFilter = buildNumberRangeFilter("price", minPrice, maxPrice);
	if (priceFilter) {
		conditions.push(priceFilter as Prisma.RoomWhereInput);
	}

	if (search) {
		conditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{
					flat: {
						building: { name: { contains: search, mode: "insensitive" } },
					},
				},
				{
					flat: {
						building: { address: { contains: search, mode: "insensitive" } },
					},
				},
				{
					flat: {
						building: { city: { contains: search, mode: "insensitive" } },
					},
				},
			],
		} as Prisma.RoomWhereInput);
	}

	const [rooms, total] = await Promise.all([
		prisma.room.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: roomWithFlatBuildingPropertyInclude,
			...buildPagination(page, limit),
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.room.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: rooms as IRoomResponse[],
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const RoomService = {
	createRoom,
	getRooms,
	getRoomById,
	updateRoom,
	deleteRoom,
	getMyRooms,
};
