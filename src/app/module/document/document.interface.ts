export interface ICreateDocumentPayload {
	applicationId: string;
	type:
		| "LEASE_AGREEMENT"
		| "MOVE_IN_CHECKLIST"
		| "MOVE_OUT_CHECKLIST"
		| "ID_DOCUMENT"
		| "INCOME_PROOF"
		| "REFERENCE_LETTER"
		| "INSURANCE"
		| "OTHER";
	title: string;
	fileUrl: string;
	expiresAt?: string;
	metadata?: Record<string, unknown>;
}

export interface IUpdateDocumentPayload {
	title?: string;
	fileUrl?: string;
	expiresAt?: string;
	metadata?: Record<string, unknown>;
}

export interface IUpdateDocumentStatusPayload {
	status: "PENDING_SIGNATURE" | "SIGNED" | "EXPIRED" | "REVOKED";
}

export interface IDocumentFilters {
	applicationId?: string;
	type?:
		| "LEASE_AGREEMENT"
		| "MOVE_IN_CHECKLIST"
		| "MOVE_OUT_CHECKLIST"
		| "ID_DOCUMENT"
		| "INCOME_PROOF"
		| "REFERENCE_LETTER"
		| "INSURANCE"
		| "OTHER";
	status?: "DRAFT" | "PENDING_SIGNATURE" | "SIGNED" | "EXPIRED" | "REVOKED";
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IDocumentResponse {
	id: string;
	applicationId: string;
	type: string;
	title: string;
	fileUrl: string;
	status: string;
	signedAt?: Date | null;
	expiresAt?: Date | null;
	metadata?: unknown;
	createdAt: Date;
	updatedAt: Date;
}

export interface IDocumentListResponse {
	data: IDocumentResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
