import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ViewingController } from "./viewing.controller";
import { ViewingValidation } from "./viewing.validation";

const router = Router();

router.post(
	"/",
	auth(Role.TENANT),
	validateRequest(ViewingValidation.createViewingSchema),
	ViewingController.createRequest,
);
router.get(
	"/",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(ViewingValidation.viewingFiltersSchema, "query"),
	ViewingController.getRequests,
);
router.get(
	"/:id",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	ViewingController.getRequestById,
);
router.patch(
	"/:id/status",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(ViewingValidation.updateViewingStatusSchema),
	ViewingController.updateRequestStatus,
);
router.delete(
	"/:id",
	auth(Role.TENANT, Role.ADMIN),
	ViewingController.deleteRequest,
);

export const ViewingRoutes = router;
