import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";

const router = Router();

router.get(
	"/users",
	auth("ADMIN"),
	validateRequest(AdminValidation.adminUserFiltersSchema),
	AdminController.getUsers,
);
router.get("/users/:id", auth("ADMIN"), AdminController.getUserById);
router.patch(
	"/users/:id/role",
	auth("ADMIN"),
	validateRequest(AdminValidation.updateUserRoleSchema),
	AdminController.updateUserRole,
);
router.patch(
	"/users/:id/status",
	auth("ADMIN"),
	validateRequest(AdminValidation.updateUserStatusSchema),
	AdminController.updateUserStatus,
);
router.delete("/users/:id", auth("ADMIN"), AdminController.deleteUser);
router.get("/stats", auth("ADMIN"), AdminController.getStats);
router.get(
	"/audit-logs",
	auth("ADMIN"),
	validateRequest(AdminValidation.auditLogFiltersSchema),
	AdminController.getAuditLogs,
);

// Dashboard routes
router.get(
	"/dashboard/landlord",
	auth("LANDLORD", "ADMIN"),
	AdminController.getLandlordDashboard,
);
router.get(
	"/dashboard/property-manager",
	auth("PROPERTY_MANAGER", "ADMIN"),
	AdminController.getPropertyManagerDashboard,
);

export const AdminRoutes = router;
