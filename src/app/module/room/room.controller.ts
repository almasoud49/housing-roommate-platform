import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RoomService } from "./room.service";
import { AppError } from "../../utils/AppError";

const createRoom = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await RoomService.createRoom(req.user.userId, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Room created successfully",
		data: result,
	});
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
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await RoomService.getRooms(filters);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Rooms retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyRooms = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

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
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await RoomService.getMyRooms(req.user.userId, filters);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "My rooms retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getRoomById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await RoomService.getRoomById(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Room retrieved successfully",
		data: result,
	});
});

const updateRoom = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { id } = req.params as { id: string };
	const result = await RoomService.updateRoom(id, req.user.userId, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Room updated successfully",
		data: result,
	});
});

const deleteRoom = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { id } = req.params as { id: string };
	await RoomService.deleteRoom(id, req.user.userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Room deleted successfully",
		data: null,
	});
});

export const RoomController = {
	createRoom,
	getRooms,
	getMyRooms,
	getRoomById,
	updateRoom,
	deleteRoom,
};
