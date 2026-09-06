import type { Role } from "../../../generated/prisma/client";

export interface ICreateRoomPayload {
	flatId: string;
	name: string;
	price: number;
	availableFrom?: string;
	availableTo?: string;
	isActive?: boolean;
}

export interface IUpdateRoomPayload {
	name?: string;
	price?: number;
	availableFrom?: string;
	availableTo?: string;
	isActive?: boolean;
}

export interface IRoomFilters {
	flatId?: string;
	isActive?: boolean;
	availableFrom?: string;
	availableTo?: string;
	minPrice?: number;
	maxPrice?: number;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IRoomResponse {
	id: string;
	flatId: string;
	name: string;
	price: number;
	availableFrom: Date | null;
	availableTo: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	flat?: {
		id: string;
		flatNumber: string;
		floor: number;
		building?: {
			id: string;
			name: string;
			address: string;
			city: string;
			property?: {
				id: string;
				title: string;
			};
		};
	};
}

export interface IRoomListResponse {
	data: IRoomResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
