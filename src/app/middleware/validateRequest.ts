import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (
	zodSchema: ZodSchema,
	target: "body" | "query" | "params" = "body",
) => {
	return catchAsync((req: Request, res: Response, next: NextFunction) => {
		const source =
			target === "body"
				? req.body
				: target === "query"
					? req.query
					: req.params;
		const result = zodSchema.safeParse(source);

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

		if (target === "body") req.body = result.data;
		next();
	});
};
