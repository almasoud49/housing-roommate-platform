import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UtilityController } from "./utility.controller";
import { UtilityValidation } from "./utility.validation";

const router = Router();

router.post(
	"/bills",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(UtilityValidation.createBillSchema),
	UtilityController.createBill,
);
router.get(
	"/bills",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(UtilityValidation.billFiltersSchema, "query"),
	UtilityController.getBills,
);
router.get("/my-bills", auth(Role.TENANT), UtilityController.getMyBills);
router.get(
	"/bills/:id",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	UtilityController.getBillById,
);
router.patch(
	"/bills/:id",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(UtilityValidation.updateBillSchema),
	UtilityController.updateBill,
);
router.patch(
	"/bills/:id/status",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(UtilityValidation.updateBillStatusSchema),
	UtilityController.updateBillStatus,
);
router.patch(
	"/splits/:splitId/pay",
	auth(Role.TENANT),
	UtilityController.paySplit,
);
router.delete(
	"/bills/:id",
	auth(Role.LANDLORD, Role.ADMIN),
	UtilityController.deleteBill,
);

export const UtilityRoutes = router;
