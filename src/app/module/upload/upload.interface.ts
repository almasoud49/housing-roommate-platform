export type UploadFolder =
	| "avatar"
	| "verification"
	| "maintenance"
	| "documents"
	| "properties"
	| "buildings"
	| "flats"
	| "rooms"
	| "misc";

export type UploadResourceType = "image" | "video" | "raw" | "auto";

export interface ICreateSignaturePayload {
	folder?: UploadFolder;
	resourceType?: UploadResourceType;
	publicIdSuffix?: string;
}

export interface IUploadSignatureResponse {
	cloudName: string;
	apiKey: string;
	timestamp: number;
	signature: string;
	folder: string;
	publicId: string;
	resourceType: UploadResourceType;
	uploadUrl: string;
	expiresAt: string;
	maxBytes: number;
}
