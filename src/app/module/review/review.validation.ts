import { z } from "zod";
import { paginationFields } from "../../validation/common";

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
	...paginationFields,
	sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
});

export const ReviewValidation = {
	createReviewSchema,
	reviewFiltersSchema,
};
