import { z } from "zod";

const uploadDocsSchema = z.object({
	documents: z
		.array(z.string().url("Invalid document URL"))
		.min(1, "At least one document is required")
		.max(5, "Maximum 5 documents allowed"),
});

const reviewSchema = z.object({
	userId: z.string().uuid("Invalid user ID"),
	action: z.enum(["APPROVE", "REJECT"]),
	notes: z.string().optional(),
});

const filtersSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
	isVerified: z.coerce.boolean().optional(),
	search: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const VerificationValidation = {
	uploadDocsSchema,
	reviewSchema,
	filtersSchema,
};
