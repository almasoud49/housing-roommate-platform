import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { ZodSchema, ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: ZodSchema) => {
	return catchAsync((req: Request, res: Response, next: NextFunction) => {
		const payload = {
			body: req.body ?? {},
			query: req.query ?? {},
			params: req.params ?? {},
		};

		const result = zodSchema.safeParse(payload);

		if (!result.success) {
			const details = result.error.issues.map((issue) => ({
				field: issue.path.join("."),
				code: issue.code,
				message: issue.message,
			}));

			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Validation failed",
				"VALIDATION_ERROR",
				details,
			);
		}

		const data = result.data as {
			body?: unknown;
			query?: unknown;
			params?: unknown;
		};

		if (data.body) req.body = data.body;
		if (data.query) req.query = data.query as Record<string, string>;
		if (data.params) req.params = data.params as Record<string, string>;

		next();
	});
};
