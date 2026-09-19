import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import { BuildingService } from "./building.service";

const createBuilding = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await BuildingService.createBuilding(userId, req.body);

	sendCreated(res, "Building created successfully", result);
});

const getBuildings = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		propertyId: (req.query.propertyId as string) || undefined,
		page: req.query.page ? Number(req.query.page) : 1,
		limit: req.query.limit ? Number(req.query.limit) : 10,
		sortBy:
			(req.query.sortBy as "createdAt" | "name" | "floors") || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await BuildingService.getBuildings(filters);

	sendPaginated(
		res,
		"Buildings retrieved successfully",
		result.data,
		result.meta,
	);
});

const getBuildingsByProperty = catchAsync(
	async (req: Request, res: Response) => {
		const { propertyId } = req.params as { propertyId: string };

		const filters = {
			page: req.query.page ? Number(req.query.page) : 1,
			limit: req.query.limit ? Number(req.query.limit) : 10,
			sortBy:
				(req.query.sortBy as "createdAt" | "name" | "floors") || "createdAt",
			sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
		};

		const result = await BuildingService.getBuildingsByProperty(
			propertyId,
			filters,
		);

		sendPaginated(
			res,
			"Buildings retrieved successfully",
			result.data,
			result.meta,
		);
	},
);

const getBuildingById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await BuildingService.getBuildingById(id);

	sendOk(res, "Building retrieved successfully", result);
});

const updateBuilding = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	const result = await BuildingService.updateBuilding(id, userId, req.body);

	sendOk(res, "Building updated successfully", result);
});

const deleteBuilding = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	await BuildingService.deleteBuilding(id, userId);

	sendOk(res, "Building deleted successfully", null);
});

export const BuildingController = {
	createBuilding,
	getBuildings,
	getBuildingsByProperty,
	getBuildingById,
	updateBuilding,
	deleteBuilding,
};
