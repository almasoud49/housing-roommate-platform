import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config";
import { AppError, type AppErrorDetails } from "../utils/AppError";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler = async (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorMessage = err.message || "Internal Server Error";
	const errorName = err.name || "Internal Server Error";
	let errorCode = "INTERNAL_SERVER_ERROR";
	let details: AppErrorDetails[] = [];

	if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorMessage = "You have provided incorrect field type or missing fields";
		errorCode = "VALIDATION_ERROR";
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			statusCode = httpStatus.CONFLICT;
			errorMessage = "Duplicate entry. A record with this value already exists";
			errorCode = "DUPLICATE_ENTRY";
			details = [
				{
					field: err.meta?.target as string,
					code: err.code,
					message: errorMessage,
				},
			];
		} else if (err.code === "P2003") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage =
				"Foreign key constraint failed. Referenced record does not exist";
			errorCode = "FOREIGN_KEY_CONSTRAINT";
			details = [{ code: err.code, message: errorMessage }];
		} else if (err.code === "P2025") {
			statusCode = httpStatus.NOT_FOUND;
			errorMessage = "Record not found";
			errorCode = "RECORD_NOT_FOUND";
		}
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		if (err.errorCode === "P1000") {
			statusCode = httpStatus.UNAUTHORIZED;
			errorMessage =
				"Authentication failed against database server. Please Check Your Credentials";
			errorCode = "DB_AUTH_FAILED";
		} else if (err.errorCode === "P1001") {
			statusCode = httpStatus.SERVICE_UNAVAILABLE;
			errorMessage = "Cannot reach database server";
			errorCode = "DB_UNAVAILABLE";
		}
	} else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		errorMessage = "Error occurred during query execution";
		errorCode = "DB_QUERY_ERROR";
	} else if (err instanceof AppError) {
		errorMessage = err.message;
		statusCode = err.statusCode;
		errorCode = err.errorCode;
		details = err.details;
	} else if (err instanceof Error) {
		errorMessage = err.message;
	}

	const isDev = config.node_env === "development";

	res.status(statusCode).json({
		success: false,
		statusCode,
		errorCode,
		message: isDev ? errorMessage : "Internal Server Error",
		details: details.length > 0 ? details : undefined,
		...(isDev && { stack: err.stack, error: err }),
	});
};
