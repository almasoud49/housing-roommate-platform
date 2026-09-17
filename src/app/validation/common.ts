import { z } from "zod";

export const paginationFields = {
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
};
