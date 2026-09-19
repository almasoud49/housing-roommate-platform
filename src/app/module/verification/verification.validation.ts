import { z } from "zod";
import { paginationFields } from "../../validation/common";

const uploadDocsSchema = z.object({
	documents: z
		.array(z.string().url("Invalid document URL"))
		.min(1, "At least one document is required")
		.max(5, "Maximum 5 documents allowed"),
});

const reviewSchema = z.object({
	userId: z.uuid("Invalid user ID"),
	action: z.enum(["APPROVE", "REJECT"]),
	notes: z.string().optional(),
});

const filtersSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
	isVerified: z.coerce.boolean().optional(),
	search: z.string().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
});

export const VerificationValidation = {
	uploadDocsSchema,
	reviewSchema,
	filtersSchema,
};
