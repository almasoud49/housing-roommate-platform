import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RoommateService } from "./roommate.service";
import type {
	IRoommatePreferencePayload,
	IMatchRequestPayload,
} from "./roommate.interface";

const createOrUpdatePrefs = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;
	const payload = req.body as IRoommatePreferencePayload;

	const result = await RoommateService.createOrUpdateRoommatePrefs(
		userId,
		payload,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Roommate preferences saved",
		data: result,
	});
});

const findMatches = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;
	const payload = req.body as IMatchRequestPayload;

	const matches = await RoommateService.findMatches(userId, payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Roommate matches found",
		data: matches,
	});
});

const createMatch = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;
	const { matchedWithId, roomId } = req.body;

	if (!matchedWithId) {
		return sendResponse(res, {
			success: false,
			statusCode: httpStatus.BAD_REQUEST,
			message: "matchedWithId is required",
			data: null,
		});
	}

	const match = await RoommateService.createMatch(
		userId,
		matchedWithId,
		roomId,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Match request sent",
		data: match,
	});
});

const updateMatchStatus = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;
	const matchId = Array.isArray(req.params.matchId)
		? req.params.matchId[0]
		: req.params.matchId;
	const { status } = req.body;

	if (!["INTERESTED", "CONNECTED", "REJECTED"].includes(status)) {
		return sendResponse(res, {
			success: false,
			statusCode: httpStatus.BAD_REQUEST,
			message: "Invalid status",
			data: null,
		});
	}

	const match = await RoommateService.updateMatchStatus(
		matchId,
		userId,
		status,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: `Match ${status.toLowerCase()}`,
		data: match,
	});
});

const getMyMatches = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;

	const matches = await RoommateService.getMyMatches(userId);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Matches retrieved",
		data: matches,
	});
});

const getMyPreferences = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user!.userId;

	const profile = await (
		await import("../../lib/prisma")
	).prisma.profile.findUnique({
		where: { userId },
		include: { roommatePrefs: true },
	});

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Preferences retrieved",
		data: profile?.roommatePrefs || null,
	});
});

export const RoommateController = {
	createOrUpdatePrefs,
	findMatches,
	createMatch,
	updateMatchStatus,
	getMyMatches,
	getMyPreferences,
};
