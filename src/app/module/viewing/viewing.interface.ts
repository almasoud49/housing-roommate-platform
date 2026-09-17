export interface ICreateViewingPayload {
	roomId: string;
	preferredDate: string;
	preferredTime: string;
	notes?: string;
}

export interface IUpdateViewingStatusPayload {
	status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

export interface IViewingFilters {
	status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
	roomId?: string;
	tenantId?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IViewingResponse {
	id: string;
	tenantId: string;
	roomId: string;
	preferredDate: Date;
	preferredTime: string;
	status: string;
	notes?: string | null;
	confirmedAt?: Date | null;
	completedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface IViewingListResponse {
	data: IViewingResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
