import { Router } from "express";
import { PropertyController } from "./property.controller";
import { PropertyValidation } from "./property.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { checkPermission } from "../../middleware/checkPermission";

const router = Router();

router.post(
	"/",
	auth("LANDLORD", "ADMIN"),
	validateRequest(PropertyValidation.createPropertySchema),
	PropertyController.createProperty,
);
router.get(
	"/",
	validateRequest(PropertyValidation.propertyFiltersSchema, "query"),
	PropertyController.getProperties,
);
router.get(
	"/my-properties",
	auth("LANDLORD"),
	validateRequest(PropertyValidation.propertyFiltersSchema, "query"),
	PropertyController.getMyProperties,
);
router.get("/:id", PropertyController.getPropertyById);
router.patch(
	"/:id",
	auth("LANDLORD", "ADMIN"),
	checkPermission("update", "property"),
	validateRequest(PropertyValidation.updatePropertySchema),
	PropertyController.updateProperty,
);
router.delete(
	"/:id",
	auth("LANDLORD", "ADMIN"),
	checkPermission("delete", "property"),
	PropertyController.deleteProperty,
);

export const PropertyRoutes = router;
