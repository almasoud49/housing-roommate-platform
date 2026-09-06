import type { Role } from "../../../generated/prisma/client";

export interface ICreateReviewPayload {
	revieweeId: string;
	rating: number;
	comment?: string;
}

export interface IReviewFilters {
	revieweeId?: string;
	search?: string;
	rating?: number;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IReviewResponse {
	id: string;
	reviewerId: string;
	revieweeId: string;
	rating: number;
	comment?: string;
	createdAt: Date;
	reviewer?: {
		id: string;
		name: string;
		email: string;
	};
	reviewee?: {
		id: string;
		name: string;
		email: string;
	};
}

export interface IReviewListResponse {
	data: IReviewResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
