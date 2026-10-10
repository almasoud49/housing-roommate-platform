import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
	"/initiate",
	auth("TENANT"),
	validateRequest(PaymentValidation.initiatePaymentSchema),
	PaymentController.initiatePayment,
);
// SSLCommerz redirects to the callback URL via GET with ?tran_id=&status=&val_id=
router.get("/sslcommerz/callback", PaymentController.sslcommerzCallback);
router.get(
	"/application/:applicationId",
	auth("TENANT"),
	PaymentController.getPaymentStatus,
);
router.get(
	"/sslcommerz/status/:valId",
	auth(),
	PaymentController.querySslcommerzStatus,
);
router.get("/:id", auth(), PaymentController.getPaymentById);
router.post(
	"/refund",
	auth("LANDLORD", "ADMIN"),
	validateRequest(PaymentValidation.refundPaymentSchema),
	PaymentController.refundPayment,
);

export const PaymentRoutes = router;
