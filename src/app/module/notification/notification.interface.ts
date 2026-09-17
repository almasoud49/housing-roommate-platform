export interface INotificationFilters {
	type?:
		| "APPLICATION_SUBMITTED"
		| "APPLICATION_ACCEPTED"
		| "APPLICATION_REJECTED"
		| "VIEWING_REQUESTED"
		| "VIEWING_CONFIRMED"
		| "VIEWING_CANCELLED"
		| "RENT_DUE"
		| "RENT_OVERDUE"
		| "RENT_PAID"
		| "MAINTENANCE_CREATED"
		| "MAINTENANCE_UPDATED"
		| "MAINTENANCE_RESOLVED"
		| "UTILITY_BILL_CREATED"
		| "UTILITY_BILL_DUE"
		| "DOCUMENT_SIGNED"
		| "DOCUMENT_EXPIRING"
		| "ROOMMATE_MATCH"
		| "SYSTEM_ANNOUNCEMENT";
	isRead?: boolean;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface INotificationResponse {
	id: string;
	userId: string;
	type: string;
	title: string;
	message: string;
	data?: unknown;
	isRead: boolean;
	readAt?: Date | null;
	createdAt: Date;
}

export interface INotificationListResponse {
	data: INotificationResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		unreadCount: number;
	};
}
