import { z } from "zod";
import { paginationFields } from "../../validation/common";

const createPropertySchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title too long"),
	description: z.string().min(10, "Description must be at least 10 characters"),
	address: z.string().min(5, "Address must be at least 5 characters"),
	city: z.string().min(2, "City must be at least 2 characters"),
});

const updatePropertySchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title too long")
		.optional(),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.optional(),
	address: z
		.string()
		.min(5, "Address must be at least 5 characters")
		.optional(),
	city: z.string().min(2, "City must be at least 2 characters").optional(),
});

const propertyFiltersSchema = z.object({
	city: z.string().optional(),
	search: z.string().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "title", "city"]).default("createdAt"),
});

export const PropertyValidation = {
	createPropertySchema,
	updatePropertySchema,
	propertyFiltersSchema,
};
