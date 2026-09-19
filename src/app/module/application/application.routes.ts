import { Router } from "express";
import { ApplicationController } from "./application.controller";
import { ApplicationValidation } from "./application.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { checkPermission } from "../../middleware/checkPermission";

const router = Router();

router.post(
	"/",
	auth("TENANT"),
	validateRequest(ApplicationValidation.createApplicationSchema),
	ApplicationController.createApplication,
);
router.get(
	"/my-applications",
	auth("TENANT"),
	validateRequest(ApplicationValidation.applicationFiltersSchema, "query"),
	ApplicationController.getMyApplications,
);
router.get(
	"/landlord",
	auth("LANDLORD", "PROPERTY_MANAGER", "ADMIN"),
	validateRequest(ApplicationValidation.applicationFiltersSchema, "query"),
	ApplicationController.getApplicationsForLandlord,
);
router.patch(
	"/:id/status",
	auth("LANDLORD", "PROPERTY_MANAGER", "ADMIN"),
	checkPermission("approve", "application"),
	validateRequest(ApplicationValidation.updateApplicationStatusSchema),
	ApplicationController.updateApplicationStatus,
);
router.patch(
	"/:id/cancel",
	auth("TENANT"),
	checkPermission("delete", "application"),
	ApplicationController.cancelApplication,
);

export const ApplicationRoutes = router;
