import { z } from "zod";

const updateProfileSchema = z.object({
	phoneNumber: z.string().optional(),
	bio: z.string().optional(),
	avatarUrl: z.url("Invalid avatar URL").optional(),
	preferences: z.string().optional(),
});

export const UserValidation = {
	updateProfileSchema,
};
