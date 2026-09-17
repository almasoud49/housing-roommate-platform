import { z } from "zod";
import { paginationFields } from "../../validation/common";
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
	search: z.string().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "status"]).default("createdAt"),
});

export const ApplicationValidation = {
	createApplicationSchema,
	updateApplicationStatusSchema,
	applicationFiltersSchema,
};
