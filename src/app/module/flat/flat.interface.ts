import type { Flat } from "../../../generated/prisma/client";

export interface ICreateFlatPayload {
	buildingId: string;
	flatNumber: string;
	floor: number;
}

export interface IUpdateFlatPayload {
	flatNumber?: string;
	floor?: number;
}

export interface IFlatFilters {
	buildingId?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "flatNumber" | "floor";
	sortOrder?: "asc" | "desc";
}

export interface IFlatResponse extends Flat {}
export interface IFlatListResponse {
	data: IFlatResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
