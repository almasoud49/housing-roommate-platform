import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UploadController } from "./upload.controller";
import { UploadValidation } from "./upload.validation";

const router = Router();

// Serverless-safe signed-URL flow: no multer, no fs, no local disk.
// Server only signs params; bytes go client -> Cloudinary directly.
router.post(
	"/signature",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(UploadValidation.signatureSchema),
	UploadController.createSignature,
);

export const UploadRoutes = router;
