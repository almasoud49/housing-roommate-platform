import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import type {
	IRoommatePreferencePayload,
	IRoommateMatchResponse,
	IMatchRequestPayload,
} from "./roommate.interface";

const calculateMatchScore = (
	seekerPrefs: any,
	potentialPrefs: any,
	seekerProfile: any,
	potentialProfile: any,
): number => {
	let score = 0;
	let totalWeight = 0;

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
		const budgetScore = Math.max(0, 1 - diff / (maxBudget * 0.5)) * 25;
		score += budgetScore;
	}
	totalWeight += 25;

	// Location compatibility (weight: 20)
	if (
		seekerPrefs.preferredCities?.length &&
		potentialPrefs.preferredCities?.length
	) {
		const cityMatch = seekerPrefs.preferredCities.filter((c: string) =>
			potentialPrefs.preferredCities.includes(c),
		).length;
		const cityScore =
			(cityMatch / Math.max(seekerPrefs.preferredCities.length, 1)) * 20;
		score += cityScore;
	}
	totalWeight += 20;

	// Lifestyle compatibility (weight: 15)
	if (seekerPrefs.lifestyle && potentialPrefs.lifestyle) {
		if (seekerPrefs.lifestyle === potentialPrefs.lifestyle) {
			score += 15;
		}
	}
	totalWeight += 15;

	// Cleanliness level (weight: 10)
	if (seekerPrefs.cleanlinessLevel && potentialPrefs.cleanlinessLevel) {
		const diff = Math.abs(
			seekerPrefs.cleanlinessLevel - potentialPrefs.cleanlinessLevel,
		);
		score += Math.max(0, 10 - diff * 2);
	}
	totalWeight += 10;

	// Noise tolerance (weight: 10)
	if (seekerPrefs.noiseTolerance && potentialPrefs.noiseTolerance) {
		const diff = Math.abs(
			seekerPrefs.noiseTolerance - potentialPrefs.noiseTolerance,
		);
		score += Math.max(0, 10 - diff * 2);
	}
	totalWeight += 10;

	// Smoking compatibility (weight: 5)
	if (
		seekerPrefs.smokingAllowed !== undefined &&
		potentialPrefs.smokingAllowed !== undefined
	) {
		if (seekerPrefs.smokingAllowed === potentialPrefs.smokingAllowed) {
			score += 5;
		}
	}
	totalWeight += 5;

	// Pets compatibility (weight: 5)
	if (
		seekerPrefs.petsAllowed !== undefined &&
		potentialPrefs.petsAllowed !== undefined
	) {
		if (seekerPrefs.petsAllowed === potentialPrefs.petsAllowed) {
			score += 5;
		}
	}
	totalWeight += 5;

	// Guests frequency (weight: 5)
	if (seekerPrefs.guestsFrequency && potentialPrefs.guestsFrequency) {
		if (seekerPrefs.guestsFrequency === potentialPrefs.guestsFrequency) {
			score += 5;
		}
	}
	totalWeight += 5;

	// Work schedule (weight: 5)
	if (seekerPrefs.workSchedule && potentialPrefs.workSchedule) {
		if (seekerPrefs.workSchedule === potentialPrefs.workSchedule) {
			score += 5;
		}
	}
	totalWeight += 5;

	// Normalize score
	return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
};

const createOrUpdateRoommatePrefs = async (
	userId: string,
	payload: IRoommatePreferencePayload,
) => {
	const profile = await prisma.profile.findUnique({
		where: { userId },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
	}

	const prefs = await prisma.roommatePreference.upsert({
		where: { profileId: profile.id },
		update: {
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
		},
		create: {
			profileId: profile.id,
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
		},
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
				deletedAt: null,
			},
			roommatePrefs: { isNot: null },
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

		const score = calculateMatchScore(
			seekerPrefs,
			potential.roommatePrefs,
			seekerProfile,
			potential,
		);

		// Only include matches above a threshold
		if (score >= 30) {
			// Check if match already exists
			const existingMatch = await prisma.roommateMatch.findUnique({
				where: {
					tenantId_matchedWithId: {
						tenantId: userId,
						matchedWithId: potential.user.id,
					},
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
		prisma.user.findUnique({ where: { id: userId } }),
		prisma.user.findUnique({ where: { id: matchedWithId } }),
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
		seekerProfile,
		matchedProfile,
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
	const match = await prisma.roommateMatch.findUnique({
		where: { id: matchId },
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
			where: { tenantId: userId },
			include: {
				matchedWith: {
					select: { id: true, name: true, email: true },
				},
				room: { select: { id: true, name: true, price: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.roommateMatch.findMany({
			where: { matchedWithId: userId },
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

export const RoommateService = {
	createOrUpdateRoommatePrefs,
	findMatches,
	createMatch,
	updateMatchStatus,
	getMyMatches,
};
