import { z } from "zod";

const signatureSchema = z.object({
	folder: z
		.enum([
			"avatar",
			"verification",
			"maintenance",
			"documents",
			"properties",
			"buildings",
			"flats",
			"rooms",
			"misc",
		])
		.default("misc"),
	resourceType: z.enum(["image", "video", "raw", "auto"]).default("image"),
	publicIdSuffix: z
		.string()
		.min(1)
		.max(60)
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			"Suffix may only contain letters, numbers, _ or -",
		)
		.optional(),
});

export const UploadValidation = {
	signatureSchema,
};
