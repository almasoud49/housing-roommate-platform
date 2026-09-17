import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateFlatPayload,
	IUpdateFlatPayload,
	IFlatFilters,
	IFlatListResponse,
	IFlatResponse,
} from "./flat.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { flatWithRoomsInclude } from "../../utils/includes";
import {
	buildPagination,
	buildOrderBy,
	buildMeta,
	applyFilters,
} from "../../utils/query";
import { assertNotDeleted } from "../../utils/auth";

const createFlat = async (
	landlordId: string,
	payload: ICreateFlatPayload,
): Promise<IFlatResponse> => {
	const building = await prisma.building.findFirst({
		where: { id: payload.buildingId, deletedAt: null },
		include: { property: true },
	});

	if (!building) {
		throw new AppError(httpStatus.NOT_FOUND, "Building not found");
	}

	if (building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only add flats to buildings in your own properties",
		);
	}

	const existingFlat = await prisma.flat.findFirst({
		where: {
			buildingId: payload.buildingId,
			flatNumber: payload.flatNumber,
			deletedAt: null,
		},
	});

	if (existingFlat) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Flat with this number already exists in this building",
		);
	}

	const flat = await prisma.flat.create({
		data: {
			buildingId: payload.buildingId,
			flatNumber: payload.flatNumber,
			floor: payload.floor,
		},
		include: flatWithRoomsInclude,
	});

	return flat as IFlatResponse;
};

const getFlats = async (filters: IFlatFilters): Promise<IFlatListResponse> => {
	const {
		buildingId,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const baseConditions: Prisma.FlatWhereInput[] = [{ deletedAt: null }];

	const conditions = applyFilters(baseConditions, {
		buildingId: buildingId ? { equals: buildingId } : undefined,
	});

	const [flats, total] = await Promise.all([
		prisma.flat.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: flatWithRoomsInclude,
			...buildPagination(page, limit),
			orderBy: buildOrderBy(sortBy, sortOrder),
		}),
		prisma.flat.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: flats as IFlatResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getFlatsByBuilding = async (
	buildingId: string,
	filters: Omit<IFlatFilters, "buildingId">,
): Promise<IFlatListResponse> => {
	return getFlats({ ...filters, buildingId });
};

const getFlatById = async (id: string): Promise<IFlatResponse> => {
	const flat = await prisma.flat.findFirst({
		where: { id, deletedAt: null },
		include: flatWithRoomsInclude,
	});

	assertNotDeleted(flat, "Flat");

	return flat as IFlatResponse;
};

const updateFlat = async (
	id: string,
	landlordId: string,
	payload: IUpdateFlatPayload,
): Promise<IFlatResponse> => {
	const flat = await prisma.flat.findFirst({
		where: { id, deletedAt: null },
		include: { building: { include: { property: true } } },
	});

	if (!flat) {
		throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
	}

	if (flat.building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update flats in your own properties",
		);
	}

	if (payload.flatNumber && payload.flatNumber !== flat.flatNumber) {
		const existingFlat = await prisma.flat.findFirst({
			where: {
				buildingId: flat.buildingId,
				flatNumber: payload.flatNumber,
				deletedAt: null,
				NOT: { id },
			},
		});

		if (existingFlat) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Flat with this number already exists in this building",
			);
		}
	}

	const updatedFlat = await prisma.flat.update({
		where: { id },
		data: payload,
		include: flatWithRoomsInclude,
	});

	return updatedFlat as IFlatResponse;
};

const deleteFlat = async (id: string, landlordId: string): Promise<void> => {
	const flat = await prisma.flat.findFirst({
		where: { id, deletedAt: null },
		include: { building: { include: { property: true } } },
	});

	if (!flat) {
		throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
	}

	if (flat.building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete flats in your own properties",
		);
	}

	await prisma.flat.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
};

export const FlatService = {
	createFlat,
	getFlats,
	getFlatsByBuilding,
	getFlatById,
	updateFlat,
	deleteFlat,
};
