import { z } from "zod";
import { paginationFields } from "../../validation/common";
import { ViewingRequestStatus } from "../../../generated/prisma/client";

const createViewingSchema = z.object({
	roomId: z.string().uuid("Invalid room ID"),
	preferredDate: z.string().datetime("Invalid preferred date"),
	preferredTime: z.string().min(1, "Preferred time is required").max(50),
	notes: z.string().max(500).optional(),
});

const updateViewingStatusSchema = z.object({
	status: z.enum([
		ViewingRequestStatus.CONFIRMED,
		ViewingRequestStatus.COMPLETED,
		ViewingRequestStatus.CANCELLED,
		ViewingRequestStatus.NO_SHOW,
	]),
});

const viewingFiltersSchema = z.object({
	status: z
		.enum([
			ViewingRequestStatus.PENDING,
			ViewingRequestStatus.CONFIRMED,
			ViewingRequestStatus.COMPLETED,
			ViewingRequestStatus.CANCELLED,
			ViewingRequestStatus.NO_SHOW,
		])
		.optional(),
	roomId: z.string().uuid("Invalid room ID").optional(),
	tenantId: z.string().uuid("Invalid tenant ID").optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "preferredDate"]).default("createdAt"),
});

export const ViewingValidation = {
	createViewingSchema,
	updateViewingStatusSchema,
	viewingFiltersSchema,
};
