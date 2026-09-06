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
router.post("/bkash/callback", PaymentController.bkashCallback);
router.get(
	"/application/:applicationId",
	auth("TENANT"),
	PaymentController.getPaymentStatus,
);
router.get("/:id", auth(), PaymentController.getPaymentById);
router.get(
	"/bkash/status/:bkashPaymentId",
	auth(),
	PaymentController.queryPaymentStatus,
);
router.post(
	"/refund",
	auth("LANDLORD", "ADMIN"),
	validateRequest(PaymentValidation.refundPaymentSchema),
	PaymentController.refundPayment,
);

export const PaymentRoutes = router;
