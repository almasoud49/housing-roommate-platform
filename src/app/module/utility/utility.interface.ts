export interface IBillSplitPayload {
	tenantId: string;
	amount: number;
}

export interface ICreateBillPayload {
	roomId: string;
	type: "ELECTRICITY" | "WATER" | "GAS" | "INTERNET" | "TRASH" | "OTHER";
	amount: number;
	currency?: string;
	billingPeriod: string;
	dueDate: string;
	billUrl?: string;
	notes?: string;
	splits: IBillSplitPayload[];
}

export interface IUpdateBillPayload {
	type?: "ELECTRICITY" | "WATER" | "GAS" | "INTERNET" | "TRASH" | "OTHER";
	amount?: number;
	currency?: string;
	billingPeriod?: string;
	dueDate?: string;
	billUrl?: string;
	notes?: string;
}

export interface IUpdateBillStatusPayload {
	status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
}

export interface IBillFilters {
	type?: "ELECTRICITY" | "WATER" | "GAS" | "INTERNET" | "TRASH" | "OTHER";
	status?: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
	roomId?: string;
	tenantId?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IBillSplitResponse {
	id: string;
	utilityBillId: string;
	tenantId: string;
	amount: number;
	status: string;
	paidDate?: Date | null;
	tenant?: {
		id: string;
		name: string;
		email: string;
	};
}

export interface IBillResponse {
	id: string;
	roomId: string;
	type: string;
	amount: number;
	currency: string;
	billingPeriod: Date;
	dueDate: Date;
	status: string;
	billUrl?: string | null;
	notes?: string | null;
	createdAt: Date;
	updatedAt: Date;
	splits?: IBillSplitResponse[];
}

export interface IBillListResponse {
	data: IBillResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
