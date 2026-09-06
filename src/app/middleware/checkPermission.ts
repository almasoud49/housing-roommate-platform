import type { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/client";
import { AppError } from "../utils/AppError";
import httpStatus from "http-status";
import {
	hasPermission,
	type PermissionAction,
	type ResourceType,
} from "../utils/permissions";

export const checkPermission = (
	action: PermissionAction,
	resourceType: ResourceType,
	getResourceId?: (req: Request) => string | undefined,
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
		}

		const resourceId = getResourceId
			? getResourceId(req)
			: (req.params.id as string) || undefined;

		const hasAccess = await hasPermission(
			{
				userId: req.user.userId,
				role: req.user.role,
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
	};
};

export const checkOwnership = (
	resourceType: ResourceType,
	getResourceId?: (req: Request) => string | undefined,
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
		}

		const resourceId = getResourceId
			? getResourceId(req)
			: (req.params.id as string) || undefined;

		if (!resourceId) {
			throw new AppError(httpStatus.BAD_REQUEST, "Resource ID is required");
		}

		const hasAccess = await hasPermission(
			{
				userId: req.user.userId,
				role: req.user.role,
				resourceId,
				resourceType,
			},
			"update",
			resourceType,
		);

		if (!hasAccess) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You don't have permission to access this resource",
			);
		}

		next();
	};
};
