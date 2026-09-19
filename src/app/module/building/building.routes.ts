import { Router } from "express";
import { BuildingController } from "./building.controller";
import { BuildingValidation } from "./building.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { checkPermission } from "../../middleware/checkPermission";

const router = Router();

router.post(
	"/",
	auth("LANDLORD", "ADMIN"),
	validateRequest(BuildingValidation.createBuildingSchema),
	BuildingController.createBuilding,
);
router.get(
	"/",
	auth(),
	validateRequest(BuildingValidation.buildingFiltersSchema, "query"),
	BuildingController.getBuildings,
);
router.get(
	"/property/:propertyId",
	auth(),
	validateRequest(BuildingValidation.buildingFiltersSchema, "query"),
	BuildingController.getBuildingsByProperty,
);
router.get("/:id", auth(), BuildingController.getBuildingById);
router.patch(
	"/:id",
	auth("LANDLORD", "ADMIN"),
	checkPermission("update", "building"),
	validateRequest(BuildingValidation.updateBuildingSchema),
	BuildingController.updateBuilding,
);
router.delete(
	"/:id",
	auth("LANDLORD", "ADMIN"),
	checkPermission("delete", "building"),
	BuildingController.deleteBuilding,
);

export const BuildingRoutes = router;
