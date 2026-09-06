import { Router } from "express";
import { RoommateController } from "./roommate.controller";
import { RoommateValidation } from "./roommate.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/client";

const router = Router();

// All routes require authentication
router.use(auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN));

// Roommate preferences
router.post(
	"/preferences",
	validateRequest(RoommateValidation.roommatePreferenceSchema),
	RoommateController.createOrUpdatePrefs,
);
router.get("/preferences", RoommateController.getMyPreferences);

// Matching
router.post(
	"/matches",
	validateRequest(RoommateValidation.matchRequestSchema),
	RoommateController.findMatches,
);
router.get("/matches", RoommateController.getMyMatches);
router.post("/matches/:matchedWithId", RoommateController.createMatch);
router.patch("/matches/:matchId/status", RoommateController.updateMatchStatus);

export const RoommateRoutes = router;
