export interface ICreateMaintenancePayload {
	roomId: string;
	title: string;
	description: string;
	category: string;
	priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	images?: string[];
	estimatedCost?: number;
	scheduledAt?: string;
}

export interface IUpdateMaintenancePayload {
	title?: string;
	description?: string;
	category?: string;
	priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	assignedTo?: string;
	estimatedCost?: number;
	actualCost?: number;
	scheduledAt?: string;
	images?: string[];
}

export interface IUpdateMaintenanceStatusPayload {
	status:
		| "OPEN"
		| "IN_PROGRESS"
		| "WAITING_PARTS"
		| "WAITING_VENDOR"
		| "RESOLVED"
		| "CLOSED"
		| "REJECTED";
}

export interface IMaintenanceFilters {
	status?:
		| "OPEN"
		| "IN_PROGRESS"
		| "WAITING_PARTS"
		| "WAITING_VENDOR"
		| "RESOLVED"
		| "CLOSED"
		| "REJECTED";
	priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	category?: string;
	roomId?: string;
	tenantId?: string;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IMaintenanceResponse {
	id: string;
	tenantId: string;
	roomId: string;
	title: string;
	description: string;
	status: string;
	priority: string;
	category: string;
	assignedTo?: string | null;
	estimatedCost?: number | null;
	actualCost?: number | null;
	scheduledAt?: Date | null;
	completedAt?: Date | null;
	images: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface IMaintenanceListResponse {
	data: IMaintenanceResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
