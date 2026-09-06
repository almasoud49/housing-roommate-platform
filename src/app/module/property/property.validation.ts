import { z } from "zod";

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
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["createdAt", "title", "city"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const PropertyValidation = {
	createPropertySchema,
	updatePropertySchema,
	propertyFiltersSchema,
};
