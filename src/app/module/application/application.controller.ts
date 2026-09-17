import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import { ApplicationService } from "./application.service";
import type { ApplicationStatus } from "../../../generated/prisma/client";

const createApplication = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await ApplicationService.createApplication(userId, req.body);

	sendCreated(res, "Application submitted successfully", result);
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const filters = {
		status: (req.query.status as ApplicationStatus) || undefined,
		search: (req.query.search as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await ApplicationService.getMyApplications(userId, filters);

	sendPaginated(
		res,
		"My applications retrieved successfully",
		result.data,
		result.meta,
	);
});

const getApplicationsForLandlord = catchAsync(
	async (req: Request, res: Response) => {
		const userId = requireUserId(req);

		const filters = {
			status: (req.query.status as ApplicationStatus) || undefined,
			search: (req.query.search as string) || undefined,
			...parseListParams(req.query),
		};

		const result = await ApplicationService.getApplicationsForLandlord(
			userId,
			filters,
		);

		sendPaginated(
			res,
			"Applications for landlord retrieved successfully",
			result.data,
			result.meta,
		);
	},
);

const updateApplicationStatus = catchAsync(
	async (req: Request, res: Response) => {
		const userId = requireUserId(req);

		const { id } = req.params as { id: string };
		const result = await ApplicationService.updateApplicationStatus(
			id,
			userId,
			req.body,
		);

		sendOk(res, "Application status updated successfully", result);
	},
);

const cancelApplication = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };
	await ApplicationService.cancelApplication(id, userId);

	sendOk(res, "Application cancelled successfully", null);
});

export const ApplicationController = {
	createApplication,
	getMyApplications,
	getApplicationsForLandlord,
	updateApplicationStatus,
	cancelApplication,
};
