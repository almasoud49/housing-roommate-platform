import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PropertyService } from "./property.service";
import { AppError } from "../../utils/AppError";

const createProperty = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await PropertyService.createProperty(
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Property created successfully",
		data: result,
	});
});

const getProperties = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		city: (req.query.city as string) || undefined,
		search: (req.query.search as string) || undefined,
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await PropertyService.getProperties(filters);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Properties retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const filters = {
		city: (req.query.city as string) || undefined,
		search: (req.query.search as string) || undefined,
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await PropertyService.getMyProperties(
		req.user.userId,
		filters,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "My properties retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await PropertyService.getPropertyById(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Property retrieved successfully",
		data: result,
	});
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { id } = req.params as { id: string };
	const result = await PropertyService.updateProperty(
		id,
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Property updated successfully",
		data: result,
	});
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { id } = req.params as { id: string };
	await PropertyService.deleteProperty(id, req.user.userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Property deleted successfully",
		data: null,
	});
});

export const PropertyController = {
	createProperty,
	getProperties,
	getMyProperties,
	getPropertyById,
	updateProperty,
	deleteProperty,
};
