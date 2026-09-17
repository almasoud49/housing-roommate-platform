import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import { RoomService } from "./room.service";

const createRoom = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await RoomService.createRoom(userId, req.body);

	sendCreated(res, "Room created successfully", result);
});

const getRooms = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		flatId: (req.query.flatId as string) || undefined,
		isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
		availableFrom: (req.query.availableFrom as string) || undefined,
		availableTo: (req.query.availableTo as string) || undefined,
		minPrice: req.query.minPrice
			? parseFloat(req.query.minPrice as string)
			: undefined,
		maxPrice: req.query.maxPrice
			? parseFloat(req.query.maxPrice as string)
			: undefined,
		...parseListParams(req.query),
	};

	const result = await RoomService.getRooms(filters);

	sendPaginated(res, "Rooms retrieved successfully", result.data, result.meta);
});

const getMyRooms = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const filters = {
		isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
		availableFrom: (req.query.availableFrom as string) || undefined,
		availableTo: (req.query.availableTo as string) || undefined,
		minPrice: req.query.minPrice
			? parseFloat(req.query.minPrice as string)
			: undefined,
		maxPrice: req.query.maxPrice
			? parseFloat(req.query.maxPrice as string)
			: undefined,
		...parseListParams(req.query),
	};

	const result = await RoomService.getMyRooms(userId, filters);

	sendPaginated(
		res,
		"My rooms retrieved successfully",
		result.data,
		result.meta,
	);
});

const getRoomById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await RoomService.getRoomById(id);

	sendOk(res, "Room retrieved successfully", result);
});

const updateRoom = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	const result = await RoomService.updateRoom(id, userId, req.body);

	sendOk(res, "Room updated successfully", result);
});

const deleteRoom = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	await RoomService.deleteRoom(id, userId);

	sendOk(res, "Room deleted successfully", null);
});

export const RoomController = {
	createRoom,
	getRooms,
	getMyRooms,
	getRoomById,
	updateRoom,
	deleteRoom,
};
