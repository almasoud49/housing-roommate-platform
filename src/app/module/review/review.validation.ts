import { z } from "zod";

const createReviewSchema = z.object({
	revieweeId: z.string().uuid("Invalid reviewee ID"),
	rating: z
		.number()
		.int()
		.min(1, "Rating must be at least 1")
		.max(5, "Rating cannot exceed 5"),
	comment: z.string().optional(),
});

const reviewFiltersSchema = z.object({
	revieweeId: z.string().uuid("Invalid reviewee ID").optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const ReviewValidation = {
	createReviewSchema,
	reviewFiltersSchema,
};
