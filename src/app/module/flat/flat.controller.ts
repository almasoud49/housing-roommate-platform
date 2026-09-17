import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import { FlatService } from "./flat.service";

const createFlat = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await FlatService.createFlat(userId, req.body);

	sendCreated(res, "Flat created successfully", result);
});

const getFlats = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		buildingId: (req.query.buildingId as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await FlatService.getFlats(filters);

	sendPaginated(res, "Flats retrieved successfully", result.data, result.meta);
});

const getFlatsByBuilding = catchAsync(async (req: Request, res: Response) => {
	const { buildingId } = req.params as { buildingId: string };

	const filters = {
		...parseListParams(req.query),
	};

	const result = await FlatService.getFlatsByBuilding(buildingId, filters);

	sendPaginated(res, "Flats retrieved successfully", result.data, result.meta);
});

const getFlatById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await FlatService.getFlatById(id);

	sendOk(res, "Flat retrieved successfully", result);
});

const updateFlat = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	const result = await FlatService.updateFlat(id, userId, req.body);

	sendOk(res, "Flat updated successfully", result);
});

const deleteFlat = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	await FlatService.deleteFlat(id, userId);

	sendOk(res, "Flat deleted successfully", null);
});

export const FlatController = {
	createFlat,
	getFlats,
	getFlatsByBuilding,
	getFlatById,
	updateFlat,
	deleteFlat,
};
