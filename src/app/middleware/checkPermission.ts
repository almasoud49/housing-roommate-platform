import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { requireUser } from "../utils/request";
import {
	hasPermission,
	type PermissionAction,
	type ResourceType,
} from "../utils/permissions";

const resolveResourceId = (
	req: Request,
	getResourceId?: (req: Request) => string | undefined,
) =>
	getResourceId ? getResourceId(req) : (req.params.id as string) || undefined;

export const checkPermission = (
	action: PermissionAction,
	resourceType: ResourceType,
	getResourceId?: (req: Request) => string | undefined,
) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const user = requireUser(req);
		const resourceId = resolveResourceId(req, getResourceId);

		const hasAccess = await hasPermission(
			{
				userId: user.userId,
				role: user.role,
				resourceId,
				resourceType,
			},
			action,
			resourceType,
		);

		if (!hasAccess) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				`You don't have permission to ${action} this ${resourceType}`,
			);
		}

		next();
	});
};

// Legacy alias: ownership check === permission check for the "update" action.
export const checkOwnership = (
	resourceType: ResourceType,
	getResourceId?: (req: Request) => string | undefined,
) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		requireUser(req);
		const resourceId = resolveResourceId(req, getResourceId);

		if (!resourceId) {
			throw new AppError(httpStatus.BAD_REQUEST, "Resource ID is required");
		}

		return checkPermission("update", resourceType, () => resourceId)(
			req,
			res,
			next,
		);
	});
};
