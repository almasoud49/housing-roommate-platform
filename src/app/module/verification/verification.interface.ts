import type { UserStatus } from "../../../generated/prisma/client";

export interface IUploadVerificationDocsPayload {
	documents: string[]; // Cloudinary URLs
}

export interface IVerificationReviewPayload {
	userId: string;
	action: "APPROVE" | "REJECT";
	notes?: string;
}

export interface IVerificationStatusResponse {
	userId: string;
	email: string;
	name: string;
	isVerified: boolean;
	verificationDocs: string[];
	status: UserStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface IVerificationListResponse {
	data: IVerificationStatusResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
