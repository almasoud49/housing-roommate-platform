import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 60,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		statusCode: 429,
		message: "Too many requests from this IP, please try again later.",
	},
});

const router = Router();

router.post(
	"/register",
	authLimiter,
	validateRequest(AuthValidation.registerSchema),
	AuthController.register,
);
router.post(
	"/login",
	authLimiter,
	validateRequest(AuthValidation.loginSchema),
	AuthController.login,
);
router.post(
	"/verify-email",
	authLimiter,
	validateRequest(AuthValidation.verifyEmailSchema),
	AuthController.verifyEmail,
);
router.post(
	"/google-login",
	authLimiter,
	validateRequest(AuthValidation.googleLoginSchema),
	AuthController.googleLogin,
);
router.post(
	"/forgot-password",
	authLimiter,
	validateRequest(AuthValidation.forgotPasswordSchema),
	AuthController.forgotPassword,
);
router.post(
	"/reset-password",
	authLimiter,
	validateRequest(AuthValidation.resetPasswordSchema),
	AuthController.resetPassword,
);
router.post("/refresh-token", authLimiter, AuthController.refreshAccessToken);
router.post("/logout", auth(), AuthController.logout);
router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
