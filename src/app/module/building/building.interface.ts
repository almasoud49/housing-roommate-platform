import type { Building } from "../../../generated/prisma/client";

export interface ICreateBuildingPayload {
	propertyId: string;
	name: string;
	floors: number;
	address: string;
	city: string;
}

export interface IUpdateBuildingPayload {
	name?: string;
	floors?: number;
	address?: string;
	city?: string;
}

export interface IBuildingFilters {
	propertyId?: string;
	city?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "name" | "floors";
	sortOrder?: "asc" | "desc";
}

export interface IBuildingResponse extends Building {}
export interface IBuildingListResponse {
	data: IBuildingResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
