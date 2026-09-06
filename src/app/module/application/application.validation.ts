import { z } from "zod";
import { ApplicationStatus } from "../../../generated/prisma/client";

const createApplicationSchema = z.object({
	roomId: z.string().uuid("Invalid room ID"),
	message: z.string().optional(),
});

const updateApplicationStatusSchema = z.object({
	status: z.enum([
		ApplicationStatus.PENDING,
		ApplicationStatus.ACCEPTED,
		ApplicationStatus.REJECTED,
	]),
});

const applicationFiltersSchema = z.object({
	status: z
		.enum([
			ApplicationStatus.PENDING,
			ApplicationStatus.ACCEPTED,
			ApplicationStatus.REJECTED,
		])
		.optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["createdAt", "status"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const ApplicationValidation = {
	createApplicationSchema,
	updateApplicationStatusSchema,
	applicationFiltersSchema,
};
