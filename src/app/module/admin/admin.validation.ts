import { z } from "zod";
import { Role, UserStatus } from "../../../generated/prisma/client";

const updateUserRoleSchema = z.object({
	role: z.enum([Role.TENANT, Role.LANDLORD, Role.ADMIN]),
});

const updateUserStatusSchema = z.object({
	status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
});

const adminUserFiltersSchema = z.object({
	role: z.enum([Role.TENANT, Role.LANDLORD, Role.ADMIN]).optional(),
	status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
	search: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z
		.enum(["createdAt", "email", "name", "role", "status"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const auditLogFiltersSchema = z.object({
	action: z.string().optional(),
	entityType: z.string().optional(),
	userId: z.string().uuid().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const AdminValidation = {
	updateUserRoleSchema,
	updateUserStatusSchema,
	adminUserFiltersSchema,
	auditLogFiltersSchema,
};
