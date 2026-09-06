import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreatePropertyPayload,
	IUpdatePropertyPayload,
	IPropertyFilters,
	IPropertyListResponse,
	IPropertyResponse,
} from "./property.interface";
import type { Prisma } from "../../../generated/prisma/client";
import { propertyWithBuildingsInclude } from "../../utils/includes";
import {
	buildPagination,
	buildOrderBy,
	buildMeta,
	buildSearchConditions,
	applyFilters,
} from "../../utils/query";
import { assertNotDeleted } from "../../utils/auth";

const createProperty = async (
	landlordId: string,
	payload: ICreatePropertyPayload,
): Promise<IPropertyResponse> => {
	const property = await prisma.property.create({
		data: {
			landlordId,
			title: payload.title,
			description: payload.description,
			address: payload.address,
			city: payload.city,
		},
		include: propertyWithBuildingsInclude,
	});

	return property as IPropertyResponse;
};

const getProperties = async (
	filters: IPropertyFilters,
): Promise<IPropertyListResponse> => {
	const {
		city,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const baseConditions: Prisma.PropertyWhereInput[] = [{ deletedAt: null }];

	const conditions = applyFilters(baseConditions, {
		city: city ? { equals: city, mode: "insensitive" } : undefined,
	});

	const searchFields = ["title", "description", "address", "city"];
	const searchCondition = buildSearchConditions(search, searchFields);
	if (searchCondition) {
		conditions.push(searchCondition as Prisma.PropertyWhereInput);
	}

	const [properties, total] = await Promise.all([
		prisma.property.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: propertyWithBuildingsInclude,
			...buildPagination(page, limit),
			orderBy: buildOrderBy(sortBy, sortOrder),
		}),
		prisma.property.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: properties as IPropertyResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getPropertyById = async (id: string): Promise<IPropertyResponse> => {
	const property = await prisma.property.findFirst({
		where: { id, deletedAt: null },
		include: propertyWithBuildingsInclude,
	});

	assertNotDeleted(property, "Property");

	return property as IPropertyResponse;
};

const updateProperty = async (
	id: string,
	landlordId: string,
	payload: IUpdatePropertyPayload,
): Promise<IPropertyResponse> => {
	const property = await prisma.property.findFirst({
		where: { id, deletedAt: null },
	});

	if (!property) {
		throw new AppError(httpStatus.NOT_FOUND, "Property not found");
	}

	if (property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only update your own properties",
		);
	}

	const updatedProperty = await prisma.property.update({
		where: { id },
		data: payload,
		include: propertyWithBuildingsInclude,
	});

	return updatedProperty as IPropertyResponse;
};

const deleteProperty = async (
	id: string,
	landlordId: string,
): Promise<void> => {
	const property = await prisma.property.findFirst({
		where: { id, deletedAt: null },
	});

	if (!property) {
		throw new AppError(httpStatus.NOT_FOUND, "Property not found");
	}

	if (property.landlordId !== landlordId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only delete your own properties",
		);
	}

	await prisma.property.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
};

const getMyProperties = async (
	landlordId: string,
	filters: IPropertyFilters,
): Promise<IPropertyListResponse> => {
	const {
		city,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const baseConditions: Prisma.PropertyWhereInput[] = [
		{ landlordId },
		{ deletedAt: null },
	];

	const conditions = applyFilters(baseConditions, {
		city: city ? { equals: city, mode: "insensitive" } : undefined,
	});

	const searchFields = ["title", "description", "address", "city"];
	const searchCondition = buildSearchConditions(search, searchFields);
	if (searchCondition) {
		conditions.push(searchCondition as Prisma.PropertyWhereInput);
	}

	const [properties, total] = await Promise.all([
		prisma.property.findMany({
			where: { AND: conditions.length > 0 ? conditions : undefined },
			include: propertyWithBuildingsInclude,
			...buildPagination(page, limit),
			orderBy: buildOrderBy(sortBy, sortOrder),
		}),
		prisma.property.count({
			where: { AND: conditions },
		}),
	]);

	return {
		data: properties as IPropertyResponse[],
		meta: buildMeta(page, limit, total),
	};
};

export const PropertyService = {
	createProperty,
	getProperties,
	getPropertyById,
	updateProperty,
	deleteProperty,
	getMyProperties,
};
