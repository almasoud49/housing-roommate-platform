import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { MaintenanceController } from "./maintenance.controller";
import { MaintenanceValidation } from "./maintenance.validation";

const router = Router();

router.post(
	"/",
	auth(Role.TENANT),
	validateRequest(MaintenanceValidation.createMaintenanceSchema),
	MaintenanceController.createRequest,
);
router.get(
	"/",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(MaintenanceValidation.maintenanceFiltersSchema, "query"),
	MaintenanceController.getRequests,
);
router.get(
	"/:id",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	MaintenanceController.getRequestById,
);
router.patch(
	"/:id",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(MaintenanceValidation.updateMaintenanceSchema),
	MaintenanceController.updateRequest,
);
router.patch(
	"/:id/status",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(MaintenanceValidation.updateMaintenanceStatusSchema),
	MaintenanceController.updateRequestStatus,
);
router.delete(
	"/:id",
	auth(Role.TENANT, Role.ADMIN),
	MaintenanceController.deleteRequest,
);

export const MaintenanceRoutes = router;
