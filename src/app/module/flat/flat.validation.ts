import { z } from "zod";
import { paginationFields } from "../../validation/common";

const createFlatSchema = z.object({
	buildingId: z.string().uuid("Invalid building ID"),
	flatNumber: z
		.string()
		.min(1, "Flat number is required")
		.max(20, "Flat number too long"),
	floor: z.number().int().min(0, "Floor must be 0 or positive"),
});

const updateFlatSchema = z.object({
	flatNumber: z
		.string()
		.min(1, "Flat number is required")
		.max(20, "Flat number too long")
		.optional(),
	floor: z.number().int().min(0, "Floor must be 0 or positive").optional(),
});

const flatFiltersSchema = z.object({
	buildingId: z.string().uuid("Invalid building ID").optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "flatNumber", "floor"]).default("createdAt"),
});

export const FlatValidation = {
	createFlatSchema,
	updateFlatSchema,
	flatFiltersSchema,
};
