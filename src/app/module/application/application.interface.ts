import type { ApplicationStatus, Role } from "../../../generated/prisma/client";

export interface ICreateApplicationPayload {
	roomId: string;
	message?: string;
}

export interface IUpdateApplicationStatusPayload {
	status: ApplicationStatus;
}

export interface IApplicationFilters {
	status?: ApplicationStatus;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IApplicationResponse {
	id: string;
	tenantId: string;
	roomId: string;
	status: ApplicationStatus;
	message?: string;
	createdAt: Date;
	updatedAt: Date;
	tenant?: {
		id: string;
		name: string;
		email: string;
		profile?: {
			phoneNumber?: string;
			bio?: string;
			avatarUrl?: string;
		};
	};
	room?: {
		id: string;
		name: string;
		price: number;
		property?: {
			id: string;
			title: string;
			address: string;
			city: string;
			landlordId: string;
		};
	};
}

export interface IApplicationListResponse {
	data: IApplicationResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
