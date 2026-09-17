import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import { PropertyService } from "./property.service";

const createProperty = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await PropertyService.createProperty(userId, req.body);

	sendCreated(res, "Property created successfully", result);
});

const getProperties = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		city: (req.query.city as string) || undefined,
		search: (req.query.search as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await PropertyService.getProperties(filters);

	sendPaginated(
		res,
		"Properties retrieved successfully",
		result.data,
		result.meta,
	);
});

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const filters = {
		city: (req.query.city as string) || undefined,
		search: (req.query.search as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await PropertyService.getMyProperties(userId, filters);

	sendPaginated(
		res,
		"My properties retrieved successfully",
		result.data,
		result.meta,
	);
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await PropertyService.getPropertyById(id);

	sendOk(res, "Property retrieved successfully", result);
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	const result = await PropertyService.updateProperty(id, userId, req.body);

	sendOk(res, "Property updated successfully", result);
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	await PropertyService.deleteProperty(id, userId);

	sendOk(res, "Property deleted successfully", null);
});

export const PropertyController = {
	createProperty,
	getProperties,
	getMyProperties,
	getPropertyById,
	updateProperty,
	deleteProperty,
};
