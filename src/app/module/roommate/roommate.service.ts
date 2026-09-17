import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import type { RoommatePreference } from "../../../generated/prisma/client";
import type {
	IRoommatePreferencePayload,
	IRoommateMatchResponse,
	IMatchRequestPayload,
} from "./roommate.interface";

// All criterion weights below sum to TOTAL_WEIGHT (100).
const TOTAL_WEIGHT = 100;

// Full points when both sides set the same value (empty values score 0).
const exactMatchScore = (
	a: string | null | undefined,
	b: string | null | undefined,
	weight: number,
): number => (a && b && a === b ? weight : 0);

// Full points when equal, linearly less as numeric values drift apart.
const proximityScore = (
	a: number | null | undefined,
	b: number | null | undefined,
	weight: number,
	pointsPerUnit: number,
): number => {
	if (!a || !b) return 0;
	return Math.max(0, weight - Math.abs(a - b) * pointsPerUnit);
};

// Full points when both booleans agree.
const booleanMatchScore = (a: boolean, b: boolean, weight: number): number =>
	a === b ? weight : 0;

const calculateMatchScore = (
	seekerPrefs: RoommatePreference,
	potentialPrefs: RoommatePreference,
): number => {
	let score = 0;

	// Budget compatibility (weight: 25)
	if (
		seekerPrefs.budgetMin &&
		seekerPrefs.budgetMax &&
		potentialPrefs.budgetMin &&
		potentialPrefs.budgetMax
	) {
		const seekerMid = (seekerPrefs.budgetMin + seekerPrefs.budgetMax) / 2;
		const potentialMid =
			(potentialPrefs.budgetMin + potentialPrefs.budgetMax) / 2;
		const diff = Math.abs(seekerMid - potentialMid);
		const maxBudget = Math.max(seekerMid, potentialMid);
		score += Math.max(0, 1 - diff / (maxBudget * 0.5)) * 25;
	}

	// Location compatibility (weight: 20)
	if (
		seekerPrefs.preferredCities?.length &&
		potentialPrefs.preferredCities?.length
	) {
		const cityMatch = seekerPrefs.preferredCities.filter((c) =>
			potentialPrefs.preferredCities.includes(c),
		).length;
		score += (cityMatch / Math.max(seekerPrefs.preferredCities.length, 1)) * 20;
	}

	score += exactMatchScore(seekerPrefs.lifestyle, potentialPrefs.lifestyle, 15);
	score += proximityScore(
		seekerPrefs.cleanlinessLevel,
		potentialPrefs.cleanlinessLevel,
		10,
		2,
	);
	score += proximityScore(
		seekerPrefs.noiseTolerance,
		potentialPrefs.noiseTolerance,
		10,
		2,
	);
	score += booleanMatchScore(
		seekerPrefs.smokingAllowed,
		potentialPrefs.smokingAllowed,
		5,
	);
	score += booleanMatchScore(
		seekerPrefs.petsAllowed,
		potentialPrefs.petsAllowed,
		5,
	);
	score += exactMatchScore(
		seekerPrefs.guestsFrequency,
		potentialPrefs.guestsFrequency,
		5,
	);
	score += exactMatchScore(
		seekerPrefs.workSchedule,
		potentialPrefs.workSchedule,
		5,
	);

	// Normalize score
	return Math.round((score / TOTAL_WEIGHT) * 100);
};

const createOrUpdateRoommatePrefs = async (
	userId: string,
	payload: IRoommatePreferencePayload,
) => {
	let profile = await prisma.profile.findUnique({
		where: { userId },
	});

	if (!profile) {
		profile = await prisma.profile.create({
			data: { userId },
		});
	}

	const prefsData = {
		budgetMin: payload.budgetMin,
		budgetMax: payload.budgetMax,
		preferredCities: payload.preferredCities || [],
		preferredAreas: payload.preferredAreas || [],
		lifestyle: payload.lifestyle,
		cleanlinessLevel: payload.cleanlinessLevel,
		noiseTolerance: payload.noiseTolerance,
		smokingAllowed: payload.smokingAllowed ?? false,
		petsAllowed: payload.petsAllowed ?? false,
		guestsFrequency: payload.guestsFrequency,
		workSchedule: payload.workSchedule,
		moveInDate: payload.moveInDate ? new Date(payload.moveInDate) : null,
		leaseDuration: payload.leaseDuration,
	};

	const prefs = await prisma.roommatePreference.upsert({
		where: { profileId: profile.id },
		update: { ...prefsData, deletedAt: null },
		create: { profileId: profile.id, ...prefsData },
	});

	return prefs;
};

const findMatches = async (
	userId: string,
	payload: IMatchRequestPayload,
): Promise<IRoommateMatchResponse[]> => {
	const seekerProfile = await prisma.profile.findUnique({
		where: { userId },
		include: { roommatePrefs: true },
	});

	if (!seekerProfile || !seekerProfile.roommatePrefs) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Roommate preferences not set. Please set your preferences first.",
		);
	}

	const seekerPrefs = seekerProfile.roommatePrefs;

	// Find potential roommates (other tenants with roommate preferences)
	const potentialProfiles = await prisma.profile.findMany({
		where: {
			user: {
				role: "TENANT",
				status: "ACTIVE",
				id: { not: userId },
			},
			roommatePrefs: {
				isNot: null,
			},
			...(payload.roomId
				? {
						user: {
							applications: {
								some: { roomId: payload.roomId, status: "ACCEPTED" },
							},
						},
					}
				: {}),
		},
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			roommatePrefs: true,
		},
	});

	const matches: IRoommateMatchResponse[] = [];

	for (const potential of potentialProfiles) {
		if (!potential.roommatePrefs) continue;

		const score = calculateMatchScore(seekerPrefs, potential.roommatePrefs);

		// Only include matches above a threshold
		if (score >= 30) {
			// Check if match already exists
			const existingMatch = await prisma.roommateMatch.findFirst({
				where: {
					tenantId: userId,
					matchedWithId: potential.user.id,
					deletedAt: null,
				},
			});

			let room = null;
			if (payload.roomId) {
				const roomData = await prisma.room.findUnique({
					where: { id: payload.roomId },
					select: { id: true, name: true, price: true },
				});
				room = roomData;
			}

			matches.push({
				id: existingMatch?.id || "",
				matchedWith: {
					id: potential.user.id,
					name: potential.user.name,
					email: potential.user.email,
					profile: {
						bio: potential.bio || undefined,
						avatarUrl: potential.avatarUrl || undefined,
					},
					roommatePrefs: {
						budgetMin: potential.roommatePrefs.budgetMin || undefined,
						budgetMax: potential.roommatePrefs.budgetMax || undefined,
						preferredCities: potential.roommatePrefs.preferredCities,
						preferredAreas: potential.roommatePrefs.preferredAreas,
						lifestyle: potential.roommatePrefs.lifestyle || undefined,
						cleanlinessLevel:
							potential.roommatePrefs.cleanlinessLevel || undefined,
						noiseTolerance: potential.roommatePrefs.noiseTolerance || undefined,
						smokingAllowed: potential.roommatePrefs.smokingAllowed,
						petsAllowed: potential.roommatePrefs.petsAllowed,
						guestsFrequency:
							potential.roommatePrefs.guestsFrequency || undefined,
						workSchedule: potential.roommatePrefs.workSchedule || undefined,
						moveInDate:
							potential.roommatePrefs.moveInDate?.toISOString() || undefined,
						leaseDuration: potential.roommatePrefs.leaseDuration || undefined,
					},
				},
				score,
				status: existingMatch?.status || "PENDING",
				room,
				createdAt:
					existingMatch?.createdAt.toISOString() || new Date().toISOString(),
			});
		}
	}

	// Sort by score descending
	matches.sort((a, b) => b.score - a.score);

	return matches;
};

const createMatch = async (
	userId: string,
	matchedWithId: string,
	roomId?: string,
) => {
	// Verify both users exist and are tenants
	const [seeker, matched] = await Promise.all([
		prisma.user.findFirst({ where: { id: userId, deletedAt: null } }),
		prisma.user.findFirst({ where: { id: matchedWithId, deletedAt: null } }),
	]);

	if (!seeker || !matched) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (seeker.role !== "TENANT" || matched.role !== "TENANT") {
		throw new AppError(httpStatus.BAD_REQUEST, "Both users must be tenants");
	}

	// Calculate score
	const [seekerProfile, matchedProfile] = await Promise.all([
		prisma.profile.findUnique({
			where: { userId },
			include: { roommatePrefs: true },
		}),
		prisma.profile.findUnique({
			where: { userId: matchedWithId },
			include: { roommatePrefs: true },
		}),
	]);

	if (!seekerProfile?.roommatePrefs || !matchedProfile?.roommatePrefs) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Both users must have roommate preferences set",
		);
	}

	const score = calculateMatchScore(
		seekerProfile.roommatePrefs,
		matchedProfile.roommatePrefs,
	);

	const match = await prisma.roommateMatch.create({
		data: {
			tenantId: userId,
			matchedWithId,
			roomId,
			score,
			status: "PENDING",
		},
	});

	// Create notification for matched user
	await prisma.notification.create({
		data: {
			userId: matchedWithId,
			type: "ROOMMATE_MATCH",
			title: "New Roommate Match",
			message: `${seeker.name} is interested in being your roommate!`,
			data: { matchId: match.id, seekerId: userId },
		},
	});

	return match;
};

const updateMatchStatus = async (
	matchId: string,
	userId: string,
	status: "INTERESTED" | "CONNECTED" | "REJECTED",
) => {
	const match = await prisma.roommateMatch.findFirst({
		where: { id: matchId, deletedAt: null },
	});

	if (!match) {
		throw new AppError(httpStatus.NOT_FOUND, "Match not found");
	}

	// Only the matched-with user can update status
	if (match.matchedWithId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Not authorized to update this match",
		);
	}

	const updated = await prisma.roommateMatch.update({
		where: { id: matchId },
		data: {
			status,
			matchedAt: status === "CONNECTED" ? new Date() : match.matchedAt,
		},
	});

	// Notify seeker
	await prisma.notification.create({
		data: {
			userId: match.tenantId,
			type: "ROOMMATE_MATCH",
			title: "Match Status Updated",
			message: `Your match request was ${status.toLowerCase()}`,
			data: { matchId, status },
		},
	});

	return updated;
};

const getMyMatches = async (userId: string) => {
	const [seekerMatches, potentialMatches] = await Promise.all([
		prisma.roommateMatch.findMany({
			where: { tenantId: userId, deletedAt: null },
			include: {
				matchedWith: {
					select: { id: true, name: true, email: true },
				},
				room: { select: { id: true, name: true, price: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.roommateMatch.findMany({
			where: { matchedWithId: userId, deletedAt: null },
			include: {
				tenant: {
					select: { id: true, name: true, email: true },
				},
				room: { select: { id: true, name: true, price: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
	]);

	return { seekerMatches, potentialMatches };
};

const deleteRoommatePrefs = async (userId: string): Promise<void> => {
	const profile = await prisma.profile.findUnique({
		where: { userId },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
	}

	await prisma.roommatePreference.update({
		where: { profileId: profile.id },
		data: { deletedAt: new Date() },
	});
};

const deleteMatch = async (matchId: string, userId: string): Promise<void> => {
	const match = await prisma.roommateMatch.findFirst({
		where: { id: matchId, deletedAt: null },
	});

	if (!match) {
		throw new AppError(httpStatus.NOT_FOUND, "Match not found");
	}

	// Only the tenant who created the match can delete it
	if (match.tenantId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Not authorized to delete this match",
		);
	}

	await prisma.roommateMatch.update({
		where: { id: matchId },
		data: { deletedAt: new Date() },
	});
};

export const RoommateService = {
	createOrUpdateRoommatePrefs,
	findMatches,
	createMatch,
	updateMatchStatus,
	getMyMatches,
	deleteRoommatePrefs,
	deleteMatch,
};
