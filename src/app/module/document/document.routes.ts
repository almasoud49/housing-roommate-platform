import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DocumentController } from "./document.controller";
import { DocumentValidation } from "./document.validation";

const router = Router();

router.post(
	"/",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(DocumentValidation.createDocumentSchema),
	DocumentController.createDocument,
);
router.get(
	"/",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(DocumentValidation.documentFiltersSchema, "query"),
	DocumentController.getDocuments,
);
router.get(
	"/:id",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	DocumentController.getDocumentById,
);
router.patch(
	"/:id",
	auth(Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(DocumentValidation.updateDocumentSchema),
	DocumentController.updateDocument,
);
router.patch(
	"/:id/status",
	auth(Role.TENANT, Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN),
	validateRequest(DocumentValidation.updateDocumentStatusSchema),
	DocumentController.updateDocumentStatus,
);
router.delete(
	"/:id",
	auth(Role.LANDLORD, Role.ADMIN),
	DocumentController.deleteDocument,
);

export const DocumentRoutes = router;
