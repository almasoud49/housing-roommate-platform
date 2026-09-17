import { z } from "zod";
import { paginationFields } from "../../validation/common";
import {
	MaintenancePriority,
	MaintenanceStatus,
} from "../../../generated/prisma/client";

const createMaintenanceSchema = z.object({
	roomId: z.string().uuid("Invalid room ID"),
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().min(1, "Description is required"),
	category: z.string().min(1, "Category is required").max(100),
	priority: z
		.enum([
			MaintenancePriority.LOW,
			MaintenancePriority.MEDIUM,
			MaintenancePriority.HIGH,
			MaintenancePriority.URGENT,
		])
		.default(MaintenancePriority.MEDIUM),
	images: z.array(z.string().url("Invalid image URL")).max(5).optional(),
	estimatedCost: z
		.number()
		.positive("Estimated cost must be positive")
		.optional(),
	scheduledAt: z.string().datetime("Invalid scheduled date").optional(),
});

const updateMaintenanceSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().min(1).optional(),
	category: z.string().min(1).max(100).optional(),
	priority: z
		.enum([
			MaintenancePriority.LOW,
			MaintenancePriority.MEDIUM,
			MaintenancePriority.HIGH,
			MaintenancePriority.URGENT,
		])
		.optional(),
	assignedTo: z.string().optional(),
	estimatedCost: z.number().positive().optional(),
	actualCost: z.number().positive().optional(),
	scheduledAt: z.string().datetime().optional(),
	images: z.array(z.string().url("Invalid image URL")).max(5).optional(),
});

const updateMaintenanceStatusSchema = z.object({
	status: z.enum([
		MaintenanceStatus.OPEN,
		MaintenanceStatus.IN_PROGRESS,
		MaintenanceStatus.WAITING_PARTS,
		MaintenanceStatus.WAITING_VENDOR,
		MaintenanceStatus.RESOLVED,
		MaintenanceStatus.CLOSED,
		MaintenanceStatus.REJECTED,
	]),
});

const maintenanceFiltersSchema = z.object({
	status: z
		.enum([
			MaintenanceStatus.OPEN,
			MaintenanceStatus.IN_PROGRESS,
			MaintenanceStatus.WAITING_PARTS,
			MaintenanceStatus.WAITING_VENDOR,
			MaintenanceStatus.RESOLVED,
			MaintenanceStatus.CLOSED,
			MaintenanceStatus.REJECTED,
		])
		.optional(),
	priority: z
		.enum([
			MaintenancePriority.LOW,
			MaintenancePriority.MEDIUM,
			MaintenancePriority.HIGH,
			MaintenancePriority.URGENT,
		])
		.optional(),
	category: z.string().optional(),
	roomId: z.string().uuid("Invalid room ID").optional(),
	tenantId: z.string().uuid("Invalid tenant ID").optional(),
	search: z.string().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "priority", "status"]).default("createdAt"),
});

export const MaintenanceValidation = {
	createMaintenanceSchema,
	updateMaintenanceSchema,
	updateMaintenanceStatusSchema,
	maintenanceFiltersSchema,
};
