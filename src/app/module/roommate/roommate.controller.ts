import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { sendBadRequest, sendCreated, sendOk } from "../../utils/sendResponse";
import { RoommateService } from "./roommate.service";
import type {
	IRoommatePreferencePayload,
	IMatchRequestPayload,
} from "./roommate.interface";

const createOrUpdatePrefs = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);
	const payload = req.body as IRoommatePreferencePayload;

	const result = await RoommateService.createOrUpdateRoommatePrefs(
		userId,
		payload,
	);

	sendOk(res, "Roommate preferences saved", result);
});

const findMatches = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);
	const payload = req.body as IMatchRequestPayload;

	const matches = await RoommateService.findMatches(userId, payload);

	sendOk(res, "Roommate matches found", matches);
});

const createMatch = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);
	const matchedWithId = req.params.matchedWithId;
	const { roomId } = req.body;

	if (!matchedWithId) {
		return sendBadRequest(res, "matchedWithId is required");
	}

	const match = await RoommateService.createMatch(
		userId,
		matchedWithId,
		roomId,
	);

	sendCreated(res, "Match request sent", match);
});

const updateMatchStatus = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);
	const matchId = Array.isArray(req.params.matchId)
		? req.params.matchId[0]
		: req.params.matchId;
	const { status } = req.body;

	if (!["INTERESTED", "CONNECTED", "REJECTED"].includes(status)) {
		return sendBadRequest(res, "Invalid status");
	}

	const match = await RoommateService.updateMatchStatus(
		matchId,
		userId,
		status,
	);

	sendOk(res, `Match ${status.toLowerCase()}`, match);
});

const getMyMatches = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const matches = await RoommateService.getMyMatches(userId);

	sendOk(res, "Matches retrieved", matches);
});

const getMyPreferences = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const profile = await (
		await import("../../lib/prisma")
	).prisma.profile.findUnique({
		where: { userId },
		include: { roommatePrefs: true },
	});

	sendOk(res, "Preferences retrieved", profile?.roommatePrefs || null);
});

export const RoommateController = {
	createOrUpdatePrefs,
	findMatches,
	createMatch,
	updateMatchStatus,
	getMyMatches,
	getMyPreferences,
};
