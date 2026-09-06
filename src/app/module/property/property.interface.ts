import type { Role } from "../../../generated/prisma/client";

export interface ICreatePropertyPayload {
	title: string;
	description: string;
	address: string;
	city: string;
}

export interface IUpdatePropertyPayload {
	title?: string;
	description?: string;
	address?: string;
	city?: string;
}

export interface IPropertyFilters {
	city?: string;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IPropertyResponse {
	id: string;
	landlordId: string;
	title: string;
	description: string;
	address: string;
	city: string;
	createdAt: Date;
	updatedAt: Date;
	buildings?: Array<{
		id: string;
		name: string;
		address: string;
		city: string;
		floors: number;
		flats?: Array<{
			id: string;
			flatNumber: string;
			floor: number;
			rooms?: Array<{
				id: string;
				name: string;
				price: number;
				isActive: boolean;
			}>;
		}>;
	}>;
}

export interface IPropertyListResponse {
	data: IPropertyResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
