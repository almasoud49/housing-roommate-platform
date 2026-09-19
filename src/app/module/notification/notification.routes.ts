import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { NotificationController } from "./notification.controller";
import { NotificationValidation } from "./notification.validation";

const router = Router();

// Native EventSource can't set Authorization headers, so allow
// GET /notifications/stream?token=<accessToken> as fallback.
// Cookies (`accessToken`) still work and take precedence in `auth()`.
const sseTokenFallback = (req: Request, _res: Response, next: NextFunction) => {
	if (!req.headers.authorization && typeof req.query.token === "string") {
		req.headers.authorization = `Bearer ${req.query.token}`;
	}
	next();
};

router.get(
	"/stream",
	sseTokenFallback,
	auth(),
	NotificationController.streamNotifications,
);

router.use(auth());

router.get(
	"/",
	validateRequest(NotificationValidation.notificationFiltersSchema, "query"),
	NotificationController.getMyNotifications,
);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/read-all", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export const NotificationRoutes = router;
