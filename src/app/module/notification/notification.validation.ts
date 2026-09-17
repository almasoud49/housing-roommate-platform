import { z } from "zod";
import { paginationFields } from "../../validation/common";
import { NotificationType } from "../../../generated/prisma/client";

const notificationFiltersSchema = z.object({
	type: z
		.enum([
			NotificationType.APPLICATION_SUBMITTED,
			NotificationType.APPLICATION_ACCEPTED,
			NotificationType.APPLICATION_REJECTED,
			NotificationType.VIEWING_REQUESTED,
			NotificationType.VIEWING_CONFIRMED,
			NotificationType.VIEWING_CANCELLED,
			NotificationType.RENT_DUE,
			NotificationType.RENT_OVERDUE,
			NotificationType.RENT_PAID,
			NotificationType.MAINTENANCE_CREATED,
			NotificationType.MAINTENANCE_UPDATED,
			NotificationType.MAINTENANCE_RESOLVED,
			NotificationType.UTILITY_BILL_CREATED,
			NotificationType.UTILITY_BILL_DUE,
			NotificationType.DOCUMENT_SIGNED,
			NotificationType.DOCUMENT_EXPIRING,
			NotificationType.ROOMMATE_MATCH,
			NotificationType.SYSTEM_ANNOUNCEMENT,
		])
		.optional(),
	isRead: z.coerce.boolean().optional(),
	...paginationFields,
	sortBy: z.enum(["createdAt"]).default("createdAt"),
});

export const NotificationValidation = {
	notificationFiltersSchema,
};
