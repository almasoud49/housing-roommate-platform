import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../utils/AppError";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
	const error = new AppError(
		httpStatus.NOT_FOUND,
		`Route ${req.originalUrl} not found`,
		"ROUTE_NOT_FOUND",
		[{ field: "path", message: `Cannot ${req.method} ${req.originalUrl}` }],
	);

	next(error);
};
