import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUser } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import type { IViewingFilters } from "./viewing.interface";
import { ViewingService } from "./viewing.service";

const createRequest = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const result = await ViewingService.createRequest(user.userId, req.body);

	sendCreated(res, "Viewing request created successfully", result);
});

const getRequests = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);
	const filters: IViewingFilters = {
		status: (req.query.status as IViewingFilters["status"]) || undefined,
		roomId: (req.query.roomId as string) || undefined,
		tenantId:
			user.role === "TENANT"
				? user.userId
				: (req.query.tenantId as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await ViewingService.getRequests(filters);

	sendPaginated(
		res,
		"Viewing requests retrieved successfully",
		result.data,
		result.meta,
	);
});

const getRequestById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await ViewingService.getRequestById(id);

	sendOk(res, "Viewing request retrieved successfully", result);
});

const updateRequestStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await ViewingService.updateRequestStatus(id, req.body);

	sendOk(res, "Viewing request status updated successfully", result);
});

const deleteRequest = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const { id } = req.params as { id: string };

	await ViewingService.deleteRequest(id, user.userId, user.role);

	sendOk(res, "Viewing request deleted successfully", null);
});

export const ViewingController = {
	createRequest,
	getRequests,
	getRequestById,
	updateRequestStatus,
	deleteRequest,
};
