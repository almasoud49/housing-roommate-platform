import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import type { Role, UserStatus } from "../../../generated/prisma/client";

const getUsers = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		role: (req.query.role as Role) || undefined,
		status: (req.query.status as UserStatus) || undefined,
		search: (req.query.search as string) || undefined,
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await AdminService.getUsers(filters);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Users retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await AdminService.getUserById(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User retrieved successfully",
		data: result,
	});
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await AdminService.updateUserRole(id, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User role updated successfully",
		data: result,
	});
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await AdminService.updateUserStatus(id, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User status updated successfully",
		data: result,
	});
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	await AdminService.deleteUser(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User deleted successfully",
		data: null,
	});
});

const getStats = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getStats();

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Dashboard stats retrieved successfully",
		data: result,
	});
});

const getLandlordDashboard = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;
	const userRole = req.user!.role;

	if (userRole !== "LANDLORD" && userRole !== "ADMIN") {
		return sendResponse(res, {
			success: false,
			statusCode: httpStatus.FORBIDDEN,
			message: "Only landlords can access this dashboard",
			data: null,
		});
	}

	const result = await AdminService.getLandlordDashboard(userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Landlord dashboard retrieved successfully",
		data: result,
	});
});

const getPropertyManagerDashboard = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;
		const userRole = req.user!.role;

		if (userRole !== "PROPERTY_MANAGER" && userRole !== "ADMIN") {
			return sendResponse(res, {
				success: false,
				statusCode: httpStatus.FORBIDDEN,
				message: "Only property managers can access this dashboard",
				data: null,
			});
		}

		const result = await AdminService.getPropertyManagerDashboard(userId);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Property manager dashboard retrieved successfully",
			data: result,
		});
	},
);

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		action: (req.query.action as string) || undefined,
		entityType: (req.query.entityType as string) || undefined,
		userId: (req.query.userId as string) || undefined,
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await AdminService.getAuditLogs(filters);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Audit logs retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const AdminController = {
	getUsers,
	getUserById,
	updateUserRole,
	updateUserStatus,
	deleteUser,
	getStats,
	getLandlordDashboard,
	getPropertyManagerDashboard,
	getAuditLogs,
};
