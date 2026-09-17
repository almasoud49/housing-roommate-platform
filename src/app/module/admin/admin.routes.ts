import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.get(
	"/users",
	auth("ADMIN"),
	validateRequest(AdminValidation.adminUserFiltersSchema, "query"),
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
	validateRequest(AdminValidation.auditLogFiltersSchema, "query"),
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
