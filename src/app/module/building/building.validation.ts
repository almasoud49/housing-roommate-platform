import { z } from "zod";
import { paginationFields } from "../../validation/common";

const createBuildingSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID"),
	name: z
		.string()
		.min(2, "Building name must be at least 2 characters")
		.max(100, "Building name too long"),
	floors: z
		.number()
		.int()
		.positive("Floors must be a positive integer")
		.default(1),
	address: z.string().min(5, "Address must be at least 5 characters"),
	city: z.string().min(2, "City must be at least 2 characters"),
});

const updateBuildingSchema = z.object({
	name: z
		.string()
		.min(2, "Building name must be at least 2 characters")
		.max(100, "Building name too long")
		.optional(),
	floors: z
		.number()
		.int()
		.positive("Floors must be a positive integer")
		.optional(),
	address: z
		.string()
		.min(5, "Address must be at least 5 characters")
		.optional(),
	city: z.string().min(2, "City must be at least 2 characters").optional(),
});

const buildingFiltersSchema = z.object({
	propertyId: z.string().uuid("Invalid property ID").optional(),
	city: z.string().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "name", "floors"]).default("createdAt"),
});

export const BuildingValidation = {
	createBuildingSchema,
	updateBuildingSchema,
	buildingFiltersSchema,
};
