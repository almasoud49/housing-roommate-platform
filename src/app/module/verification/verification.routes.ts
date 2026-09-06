import { Router } from "express";
import { VerificationController } from "./verification.controller";
import { VerificationValidation } from "./verification.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/client";

const router = Router();

// Tenant routes
router.post(
	"/documents",
	auth(Role.TENANT),
	validateRequest(VerificationValidation.uploadDocsSchema),
	VerificationController.uploadVerificationDocs,
);
router.get(
	"/my-status",
	auth(Role.TENANT),
	VerificationController.getMyVerificationStatus,
);

// Admin routes
router.get(
	"/pending",
	auth(Role.ADMIN),
	validateRequest(VerificationValidation.filtersSchema),
	VerificationController.getPendingVerifications,
);
router.patch(
	"/review",
	auth(Role.ADMIN),
	validateRequest(VerificationValidation.reviewSchema),
	VerificationController.reviewVerification,
);

export const VerificationRoutes = router;
