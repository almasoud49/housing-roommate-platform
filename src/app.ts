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
import { notFound } from "./app/middleware/notFound";
import { AdminRoutes } from "./app/module/admin/admin.routes";
import { ApplicationRoutes } from "./app/module/application/application.routes";
import { AuthRoutes } from "./app/module/auth/auth.routes";
import { BuildingRoutes } from "./app/module/building/building.routes";
import { DocumentRoutes } from "./app/module/document/document.routes";
import { FlatRoutes } from "./app/module/flat/flat.routes";
import { MaintenanceRoutes } from "./app/module/maintenance/maintenance.routes";
import { NotificationRoutes } from "./app/module/notification/notification.routes";
import { PaymentRoutes } from "./app/module/payment/payment.routes";
import { PropertyRoutes } from "./app/module/property/property.routes";
import { ReviewRoutes } from "./app/module/review/review.routes";
import { RoomRoutes } from "./app/module/room/room.routes";
import { RoommateRoutes } from "./app/module/roommate/roommate.routes";
import { UserRoutes } from "./app/module/user/user.routes";
import { UploadRoutes } from "./app/module/upload/upload.routes";
import { UtilityRoutes } from "./app/module/utility/utility.routes";
import { VerificationRoutes } from "./app/module/verification/verification.routes";
import { ViewingRoutes } from "./app/module/viewing/viewing.routes";

const app: Application = express();

// Required behind Vercel's reverse proxy: correct protocol/IP detection
// so `secure` cookies and redirects work over HTTPS.
app.set("trust proxy", 1);

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
app.use("/api/v1/buildings", BuildingRoutes);
app.use("/api/v1/flats", FlatRoutes);
app.use("/api/v1/rooms", RoomRoutes);
app.use("/api/v1/applications", ApplicationRoutes);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/payment", PaymentRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/roommate", RoommateRoutes);
app.use("/api/v1/verification", VerificationRoutes);
app.use("/api/v1/maintenance", MaintenanceRoutes);
app.use("/api/v1/viewings", ViewingRoutes);
app.use("/api/v1/utilities", UtilityRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/documents", DocumentRoutes);
app.use("/api/v1/uploads", UploadRoutes);

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
