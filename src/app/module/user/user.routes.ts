import { Router } from "express";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.get("/me", auth(), UserController.getMe);
router.patch(
	"/me",
	auth(),
	validateRequest(UserValidation.updateProfileSchema),
	UserController.updateProfile,
);

export const UserRoutes = router;
