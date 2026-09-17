import { z } from "zod";
import { paginationFields } from "../../validation/common";
import {
	UtilityBillStatus,
	UtilityType,
} from "../../../generated/prisma/client";

const utilityTypeEnum = z.enum([
	UtilityType.ELECTRICITY,
	UtilityType.WATER,
	UtilityType.GAS,
	UtilityType.INTERNET,
	UtilityType.TRASH,
	UtilityType.OTHER,
]);

const billSplitSchema = z.object({
	tenantId: z.string().uuid("Invalid tenant ID"),
	amount: z.number().positive("Split amount must be positive"),
});

const createBillSchema = z
	.object({
		roomId: z.string().uuid("Invalid room ID"),
		type: utilityTypeEnum,
		amount: z.number().positive("Amount must be positive"),
		currency: z.string().length(3, "Currency must be 3 letters").default("BDT"),
		billingPeriod: z.string().datetime("Invalid billing period"),
		dueDate: z.string().datetime("Invalid due date"),
		billUrl: z.string().url("Invalid bill URL").optional(),
		notes: z.string().max(500).optional(),
		splits: z.array(billSplitSchema).min(1, "At least one split is required"),
	})
	.refine(
		(data) => {
			const splitTotal = data.splits.reduce((sum, s) => sum + s.amount, 0);
			return Math.abs(splitTotal - data.amount) < 0.01;
		},
		{ message: "Split amounts must add up to the bill amount" },
	);

const updateBillSchema = z.object({
	type: utilityTypeEnum.optional(),
	amount: z.number().positive().optional(),
	currency: z.string().length(3).optional(),
	billingPeriod: z.string().datetime().optional(),
	dueDate: z.string().datetime().optional(),
	billUrl: z.string().url("Invalid bill URL").optional(),
	notes: z.string().max(500).optional(),
});

const updateBillStatusSchema = z.object({
	status: z.enum([
		UtilityBillStatus.PENDING,
		UtilityBillStatus.PAID,
		UtilityBillStatus.PARTIAL,
		UtilityBillStatus.OVERDUE,
	]),
});

const billFiltersSchema = z.object({
	type: utilityTypeEnum.optional(),
	status: z
		.enum([
			UtilityBillStatus.PENDING,
			UtilityBillStatus.PAID,
			UtilityBillStatus.PARTIAL,
			UtilityBillStatus.OVERDUE,
		])
		.optional(),
	roomId: z.string().uuid("Invalid room ID").optional(),
	tenantId: z.string().uuid("Invalid tenant ID").optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "dueDate", "amount"]).default("createdAt"),
});

export const UtilityValidation = {
	createBillSchema,
	updateBillSchema,
	updateBillStatusSchema,
	billFiltersSchema,
};
