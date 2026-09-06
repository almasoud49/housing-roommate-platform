import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { AuthRoutes } from "./app/module/auth/auth.routes";
import { UserRoutes } from "./app/module/user/user.routes";
import { PropertyRoutes } from "./app/module/property/property.routes";
import { RoomRoutes } from "./app/module/room/room.routes";
import { ApplicationRoutes } from "./app/module/application/application.routes";
import { ReviewRoutes } from "./app/module/review/review.routes";
import { PaymentRoutes } from "./app/module/payment/payment.routes";
import { AdminRoutes } from "./app/module/admin/admin.routes";
import { RoommateRoutes } from "./app/module/roommate/roommate.routes";
import { VerificationRoutes } from "./app/module/verification/verification.routes";
import { notFound } from "./app/middleware/notFound";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// API v1 routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/properties", PropertyRoutes);
app.use("/api/v1/rooms", RoomRoutes);
app.use("/api/v1/applications", ApplicationRoutes);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/payment", PaymentRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/roommate", RoommateRoutes);
app.use("/api/v1/verification", VerificationRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to Housing and Roommate Platform Backend",
	});
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

export default app;
