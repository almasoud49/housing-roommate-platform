import { z } from "zod";

const roommatePreferenceSchema = z.object({
	budgetMin: z.number().min(0).optional(),
	budgetMax: z.number().min(0).optional(),
	preferredCities: z.array(z.string()).optional().default([]),
	preferredAreas: z.array(z.string()).optional().default([]),
	lifestyle: z.string().optional(),
	cleanlinessLevel: z.number().min(1).max(5).optional(),
	noiseTolerance: z.number().min(1).max(5).optional(),
	smokingAllowed: z.boolean().optional().default(false),
	petsAllowed: z.boolean().optional().default(false),
	guestsFrequency: z.enum(["rare", "occasional", "frequent"]).optional(),
	workSchedule: z.enum(["day", "night", "shift", "remote"]).optional(),
	moveInDate: z.string().datetime().optional(),
	leaseDuration: z.number().min(1).max(24).optional(),
});

const matchRequestSchema = z.object({
	roomId: z.string().uuid().optional(),
});

export const RoommateValidation = {
	roommatePreferenceSchema,
	matchRequestSchema,
};
