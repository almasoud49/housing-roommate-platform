import { Router } from "express";
import { RoommateController } from "./roommate.controller";
import { RoommateValidation } from "./roommate.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/client";

const router = Router();

// All routes require authentication
router.use(auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN));

// Roommate preferences — tenant feature
router.post(
	"/preferences",
	auth(Role.TENANT),
	validateRequest(RoommateValidation.roommatePreferenceSchema),
	RoommateController.createOrUpdatePrefs,
);
router.get(
	"/preferences",
	auth(Role.TENANT),
	RoommateController.getMyPreferences,
);

// Matching — tenant feature (admin read-only)
router.post(
	"/matches",
	auth(Role.TENANT),
	validateRequest(RoommateValidation.matchRequestSchema),
	RoommateController.findMatches,
);
router.get(
	"/matches",
	auth(Role.TENANT, Role.ADMIN),
	RoommateController.getMyMatches,
);
router.post(
	"/matches/:matchedWithId",
	auth(Role.TENANT),
	RoommateController.createMatch,
);
router.patch(
	"/matches/:matchId/status",
	auth(Role.TENANT),
	RoommateController.updateMatchStatus,
);

export const RoommateRoutes = router;
