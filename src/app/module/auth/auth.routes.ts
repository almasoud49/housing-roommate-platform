import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
	"/register",
	validateRequest(AuthValidation.registerSchema),
	AuthController.register,
);
router.post(
	"/login",
	validateRequest(AuthValidation.loginSchema),
	AuthController.login,
);
router.post(
	"/verify-email",
	validateRequest(AuthValidation.verifyEmailSchema),
	AuthController.verifyEmail,
);
router.post(
	"/google-login",
	validateRequest(AuthValidation.googleLoginSchema),
	AuthController.googleLogin,
);
router.post(
	"/forgot-password",
	validateRequest(AuthValidation.forgotPasswordSchema),
	AuthController.forgotPassword,
);
router.post(
	"/reset-password",
	validateRequest(AuthValidation.resetPasswordSchema),
	AuthController.resetPassword,
);
router.post("/refresh-token", AuthController.refreshAccessToken);
router.post("/logout", auth(), AuthController.logout);
router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
