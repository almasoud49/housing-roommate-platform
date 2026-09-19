import crypto from "node:crypto";
import httpStatus from "http-status";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { AppError } from "../../utils/AppError";
import type {
	ICreateSignaturePayload,
	IUploadSignatureResponse,
} from "./upload.interface";

const SIGNATURE_TTL_SECONDS = 10 * 60;

const MAX_BYTES_BY_RESOURCE: Record<string, number> = {
	image: 5 * 1024 * 1024,
	video: 50 * 1024 * 1024,
	raw: 10 * 1024 * 1024,
	auto: 10 * 1024 * 1024,
};

const createSignature = async (
	userId: string,
	payload: ICreateSignaturePayload,
): Promise<IUploadSignatureResponse> => {
	const cloudName = config.cloudinary_cloud_name;
	const apiKey = config.cloudinary_api_key;
	const apiSecret = config.cloudinary_api_secret;

	if (!cloudName || !apiKey || !apiSecret) {
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			"Cloudinary is not configured",
		);
	}

	const folderShort = payload.folder ?? "misc";
	const resourceType = payload.resourceType ?? "image";
	const timestamp = Math.floor(Date.now() / 1000);

	// Scope every upload to the requesting user so clients cannot
	// overwrite each other's assets. Suffix is optional + sanitized by Zod.
	const random = crypto.randomBytes(8).toString("hex");
	const suffix = payload.publicIdSuffix ? `-${payload.publicIdSuffix}` : "";
	const publicId = `${userId}/${timestamp}-${random}${suffix}`;
	const folder = `housing-roommate/${folderShort}`;

	// Only these params are signed — the client must send back the exact
	// same values (plus file + api_key + timestamp + signature) directly
	// to Cloudinary. The secret never leaves the server and no file bytes
	// touch our (ephemeral, read-only) serverless disk.
	const paramsToSign = {
		timestamp,
		folder,
		public_id: publicId,
	};

	const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

	return {
		cloudName,
		apiKey,
		timestamp,
		signature,
		folder,
		publicId,
		resourceType,
		uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
		expiresAt: new Date(
			(timestamp + SIGNATURE_TTL_SECONDS) * 1000,
		).toISOString(),
		maxBytes: MAX_BYTES_BY_RESOURCE[resourceType] ?? MAX_BYTES_BY_RESOURCE.auto,
	};
};

export const UploadService = {
	createSignature,
};
