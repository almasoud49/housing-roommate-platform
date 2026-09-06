import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApplicationService } from "./application.service";
import { AppError } from "../../utils/AppError";
import type { ApplicationStatus } from "../../../generated/prisma/client";

const createApplication = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await ApplicationService.createApplication(
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Application submitted successfully",
		data: result,
	});
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const filters = {
		status: (req.query.status as ApplicationStatus) || undefined,
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await ApplicationService.getMyApplications(
		req.user.userId,
		filters,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "My applications retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getApplicationsForLandlord = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user?.userId) {
			throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
		}

		const filters = {
			status: (req.query.status as ApplicationStatus) || undefined,
			page: req.query.page ? parseInt(req.query.page as string) : 1,
			limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
			sortBy: (req.query.sortBy as string) || "createdAt",
			sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
		};

		const result = await ApplicationService.getApplicationsForLandlord(
			req.user.userId,
			filters,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Applications for landlord retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

const updateApplicationStatus = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user?.userId) {
			throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
		}

		const { id } = req.params as { id: string };
		const result = await ApplicationService.updateApplicationStatus(
			id,
			req.user.userId,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Application status updated successfully",
			data: result,
		});
	},
);

const cancelApplication = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const { id } = req.params as { id: string };
	await ApplicationService.cancelApplication(id, req.user.userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Application cancelled successfully",
		data: null,
	});
});

export const ApplicationController = {
	createApplication,
	getMyApplications,
	getApplicationsForLandlord,
	updateApplicationStatus,
	cancelApplication,
};
