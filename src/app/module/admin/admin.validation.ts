import { z } from "zod";
import { paginationFields } from "../../validation/common";
import { Role, UserStatus } from "../../../generated/prisma/client";

const updateUserRoleSchema = z.object({
	role: z.enum([Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN]),
});

const updateUserStatusSchema = z.object({
	status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
});

const adminUserFiltersSchema = z.object({
	role: z
		.enum([Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN])
		.optional(),
	status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]).optional(),
	search: z.string().optional(),
	...paginationFields,
	sortBy: z
		.enum(["createdAt", "email", "name", "role", "status"])
		.default("createdAt"),
});

const auditLogFiltersSchema = z.object({
	action: z.string().optional(),
	entityType: z.string().optional(),
	userId: z.string().uuid().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt"]).default("createdAt"),
});

export const AdminValidation = {
	updateUserRoleSchema,
	updateUserStatusSchema,
	adminUserFiltersSchema,
	auditLogFiltersSchema,
};
