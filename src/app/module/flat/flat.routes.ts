import { Router } from "express";
import { FlatController } from "./flat.controller";
import { FlatValidation } from "./flat.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { checkPermission } from "../../middleware/checkPermission";

const router = Router();

router.post(
	"/",
	auth("LANDLORD"),
	validateRequest(FlatValidation.createFlatSchema),
	FlatController.createFlat,
);
router.get(
	"/",
	auth(),
	validateRequest(FlatValidation.flatFiltersSchema, "query"),
	FlatController.getFlats,
);
router.get(
	"/building/:buildingId",
	auth(),
	validateRequest(FlatValidation.flatFiltersSchema, "query"),
	FlatController.getFlatsByBuilding,
);
router.get("/:id", auth(), FlatController.getFlatById);
router.patch(
	"/:id",
	auth("LANDLORD"),
	checkPermission("update", "flat"),
	validateRequest(FlatValidation.updateFlatSchema),
	FlatController.updateFlat,
);
router.delete(
	"/:id",
	auth("LANDLORD"),
	checkPermission("delete", "flat"),
	FlatController.deleteFlat,
);

export const FlatRoutes = router;
