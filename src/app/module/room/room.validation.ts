import { z } from "zod";

const createRoomSchema = z.object({
	flatId: z.string().uuid("Invalid flat ID"),
	name: z
		.string()
		.min(2, "Room name must be at least 2 characters")
		.max(50, "Room name too long"),
	price: z.number().positive("Price must be positive"),
	availableFrom: z.string().datetime().optional(),
	availableTo: z.string().datetime().optional(),
	isActive: z.boolean().default(true),
});

const updateRoomSchema = z.object({
	name: z
		.string()
		.min(2, "Room name must be at least 2 characters")
		.max(50, "Room name too long")
		.optional(),
	price: z.number().positive("Price must be positive").optional(),
	availableFrom: z.string().datetime().optional(),
	availableTo: z.string().datetime().optional(),
	isActive: z.boolean().optional(),
});

const roomFiltersSchema = z.object({
	flatId: z.string().uuid("Invalid flat ID").optional(),
	isActive: z.coerce.boolean().optional(),
	availableFrom: z.string().datetime().optional(),
	availableTo: z.string().datetime().optional(),
	minPrice: z.coerce.number().positive().optional(),
	maxPrice: z.coerce.number().positive().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["createdAt", "price", "name"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const RoomValidation = {
	createRoomSchema,
	updateRoomSchema,
	roomFiltersSchema,
};
