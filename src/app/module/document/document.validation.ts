import { z } from "zod";
import { paginationFields } from "../../validation/common";
import { DocumentStatus, DocumentType } from "../../../generated/prisma/client";

const documentTypeEnum = z.enum([
	DocumentType.LEASE_AGREEMENT,
	DocumentType.MOVE_IN_CHECKLIST,
	DocumentType.MOVE_OUT_CHECKLIST,
	DocumentType.ID_DOCUMENT,
	DocumentType.INCOME_PROOF,
	DocumentType.REFERENCE_LETTER,
	DocumentType.INSURANCE,
	DocumentType.OTHER,
]);

const createDocumentSchema = z.object({
	applicationId: z.string().uuid("Invalid application ID"),
	type: documentTypeEnum,
	title: z.string().min(1, "Title is required").max(200),
	fileUrl: z.string().url("Invalid file URL"),
	expiresAt: z.string().datetime("Invalid expiry date").optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateDocumentSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	fileUrl: z.string().url("Invalid file URL").optional(),
	expiresAt: z.string().datetime().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateDocumentStatusSchema = z.object({
	status: z.enum([
		DocumentStatus.PENDING_SIGNATURE,
		DocumentStatus.SIGNED,
		DocumentStatus.EXPIRED,
		DocumentStatus.REVOKED,
	]),
});

const documentFiltersSchema = z.object({
	applicationId: z.string().uuid("Invalid application ID").optional(),
	type: documentTypeEnum.optional(),
	status: z
		.enum([
			DocumentStatus.DRAFT,
			DocumentStatus.PENDING_SIGNATURE,
			DocumentStatus.SIGNED,
			DocumentStatus.EXPIRED,
			DocumentStatus.REVOKED,
		])
		.optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt", "expiresAt"]).default("createdAt"),
});

export const DocumentValidation = {
	createDocumentSchema,
	updateDocumentSchema,
	updateDocumentStatusSchema,
	documentFiltersSchema,
};
