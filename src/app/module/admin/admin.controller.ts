import type { Request, Response } from "express";
import type { Role, UserStatus } from "../../../generated/prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { requireUser } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendForbidden, sendOk, sendPaginated } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const getUsers = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		role: (req.query.role as Role) || undefined,
		status: (req.query.status as UserStatus) || undefined,
		search: (req.query.search as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await AdminService.getUsers(filters);

	sendPaginated(res, "Users retrieved successfully", result.data, result.meta);
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await AdminService.getUserById(id);

	sendOk(res, "User retrieved successfully", result);
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await AdminService.updateUserRole(id, req.body);

	sendOk(res, "User role updated successfully", result);
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await AdminService.updateUserStatus(id, req.body);

	sendOk(res, "User status updated successfully", result);
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	await AdminService.deleteUser(id);

	sendOk(res, "User deleted successfully", null);
});

const getStats = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getStats();

	sendOk(res, "Dashboard stats retrieved successfully", result);
});

const getLandlordDashboard = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);
	const userId = user.userId;
	const userRole = user.role;

	if (userRole !== "LANDLORD" && userRole !== "ADMIN") {
		return sendForbidden(res, "Only landlords can access this dashboard");
	}

	const result = await AdminService.getLandlordDashboard(userId);

	sendOk(res, "Landlord dashboard retrieved successfully", result);
});

const getPropertyManagerDashboard = catchAsync(
	async (req: Request, res: Response) => {
		const user = requireUser(req);
		const userId = user.userId;
		const userRole = user.role;

		if (userRole !== "PROPERTY_MANAGER" && userRole !== "ADMIN") {
			return sendForbidden(
				res,
				"Only property managers can access this dashboard",
			);
		}

		const result = await AdminService.getPropertyManagerDashboard(userId);

		sendOk(res, "Property manager dashboard retrieved successfully", result);
	},
);

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		action: (req.query.action as string) || undefined,
		entityType: (req.query.entityType as string) || undefined,
		userId: (req.query.userId as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await AdminService.getAuditLogs(filters);

	sendPaginated(
		res,
		"Audit logs retrieved successfully",
		result.data,
		result.meta,
	);
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
