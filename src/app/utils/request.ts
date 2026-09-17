import type { Request } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../middleware/checkAuth";
import { AppError } from "./AppError";

// All API routes run behind `auth(...)`, which guarantees `req.user`.
// Use these helpers instead of repeating the `req.user?.userId` guard
// in every controller.
export const requireUser = (req: Request): RequestUser => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}
	return req.user;
};

export const requireUserId = (req: Request): string => requireUser(req).userId;
