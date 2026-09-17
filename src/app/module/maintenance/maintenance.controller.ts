import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUser } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import type { IMaintenanceFilters } from "./maintenance.interface";
import { MaintenanceService } from "./maintenance.service";

const createRequest = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const result = await MaintenanceService.createRequest(user.userId, req.body);

	sendCreated(res, "Maintenance request created successfully", result);
});

const getRequests = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);
	const filters: IMaintenanceFilters = {
		status: (req.query.status as IMaintenanceFilters["status"]) || undefined,
		priority:
			(req.query.priority as IMaintenanceFilters["priority"]) || undefined,
		category: (req.query.category as string) || undefined,
		roomId: (req.query.roomId as string) || undefined,
		tenantId:
			user.role === "TENANT"
				? user.userId
				: (req.query.tenantId as string) || undefined,
		search: (req.query.search as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await MaintenanceService.getRequests(filters);

	sendPaginated(
		res,
		"Maintenance requests retrieved successfully",
		result.data,
		result.meta,
	);
});

const getRequestById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await MaintenanceService.getRequestById(id);

	sendOk(res, "Maintenance request retrieved successfully", result);
});

const updateRequest = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const { id } = req.params as { id: string };

	const result = await MaintenanceService.updateRequest(
		id,
		user.userId,
		user.role,
		req.body,
	);

	sendOk(res, "Maintenance request updated successfully", result);
});

const updateRequestStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await MaintenanceService.updateRequestStatus(id, req.body);

	sendOk(res, "Maintenance request status updated successfully", result);
});

const deleteRequest = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const { id } = req.params as { id: string };

	await MaintenanceService.deleteRequest(id, user.userId, user.role);

	sendOk(res, "Maintenance request deleted successfully", null);
});

export const MaintenanceController = {
	createRequest,
	getRequests,
	getRequestById,
	updateRequest,
	updateRequestStatus,
	deleteRequest,
};
