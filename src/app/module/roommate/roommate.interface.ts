import type { Role } from "../../../generated/prisma/client";

export interface IRoommatePreferencePayload {
	budgetMin?: number;
	budgetMax?: number;
	preferredCities?: string[];
	preferredAreas?: string[];
	lifestyle?: string;
	cleanlinessLevel?: number;
	noiseTolerance?: number;
	smokingAllowed?: boolean;
	petsAllowed?: boolean;
	guestsFrequency?: string;
	workSchedule?: string;
	moveInDate?: string;
	leaseDuration?: number;
}

export interface IRoommateMatchResponse {
	id: string;
	matchedWith: {
		id: string;
		name: string;
		email: string;
		profile: {
			bio?: string;
			avatarUrl?: string;
		} | null;
		roommatePrefs: {
			budgetMin?: number;
			budgetMax?: number;
			preferredCities: string[];
			preferredAreas: string[];
			lifestyle?: string;
			cleanlinessLevel?: number;
			noiseTolerance?: number;
			smokingAllowed: boolean;
			petsAllowed: boolean;
			guestsFrequency?: string;
			workSchedule?: string;
			moveInDate?: string;
			leaseDuration?: number;
		} | null;
	};
	score: number;
	status: string;
	room?: {
		id: string;
		name: string;
		price: number;
	} | null;
	createdAt: string;
}

export interface IMatchRequestPayload {
	roomId?: string;
}
