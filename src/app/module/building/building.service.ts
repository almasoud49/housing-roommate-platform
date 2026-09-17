import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateBuildingPayload,
	IUpdateBuildingPayload,
	IBuildingFilters,
	IBuildingListResponse,
	IBuildingResponse,
} from "./building.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { buildingWithFlatsInclude } from "../../utils/includes";
import {
	buildPagination,
	buildOrderBy,
	buildMeta,
	applyFilters,
} from "../../utils/query";
import { assertNotDeleted } from "../../utils/auth";

const createBuilding = async (
	landlordId: string,
	payload: ICreateBuildingPayload,
): Promise<IBuildingResponse> => {
	const property = await prisma.property.findFirst({
		where: { id: payload.propertyId, deletedAt: null },
	});

	if (!property) {
		throw new AppError(httpStatus.NOT_FOUND, "Property not found");
	}

	if (property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only add buildings to your own properties",
		);
	}

	const building = await prisma.building.create({
		data: {
			propertyId: payload.propertyId,
			name: payload.name,
			floors: payload.floors,
			address: payload.address,
			city: payload.city,
		},
		include: buildingWithFlatsInclude,
	});

	return building as IBuildingResponse;
};

const getBuildings = async (
	filters: IBuildingFilters,
): Promise<IBuildingListResponse> => {
	const {
		propertyId,
		city,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const baseConditions: Prisma.BuildingWhereInput[] = [{ deletedAt: null }];

	const conditions = applyFilters(baseConditions, {
		propertyId: propertyId ? { equals: propertyId } : undefined,
		city: city ? { equals: city, mode: "insensitive" } : undefined,
	});

	const [buildings, total] = await Promise.all([
		prisma.building.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: buildingWithFlatsInclude,
			...buildPagination(page, limit),
			orderBy: buildOrderBy(sortBy, sortOrder),
		}),
		prisma.building.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: buildings as IBuildingResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getBuildingsByProperty = async (
	propertyId: string,
	filters: Omit<IBuildingFilters, "propertyId">,
): Promise<IBuildingListResponse> => {
	return getBuildings({ ...filters, propertyId });
};

const getBuildingById = async (id: string): Promise<IBuildingResponse> => {
	const building = await prisma.building.findFirst({
		where: { id, deletedAt: null },
		include: buildingWithFlatsInclude,
	});

	assertNotDeleted(building, "Building");

	return building as IBuildingResponse;
};

const updateBuilding = async (
	id: string,
	landlordId: string,
	payload: IUpdateBuildingPayload,
): Promise<IBuildingResponse> => {
	const building = await prisma.building.findFirst({
		where: { id, deletedAt: null },
		include: { property: true },
	});

	if (!building) {
		throw new AppError(httpStatus.NOT_FOUND, "Building not found");
	}

	if (building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update buildings in your own properties",
		);
	}

	const updatedBuilding = await prisma.building.update({
		where: { id },
		data: payload,
		include: buildingWithFlatsInclude,
	});

	return updatedBuilding as IBuildingResponse;
};

const deleteBuilding = async (
	id: string,
	landlordId: string,
): Promise<void> => {
	const building = await prisma.building.findFirst({
		where: { id, deletedAt: null },
		include: { property: true },
	});

	if (!building) {
		throw new AppError(httpStatus.NOT_FOUND, "Building not found");
	}

	if (building.property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete buildings in your own properties",
		);
	}

	await prisma.building.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
};

export const BuildingService = {
	createBuilding,
	getBuildings,
	getBuildingsByProperty,
	getBuildingById,
	updateBuilding,
	deleteBuilding,
};
