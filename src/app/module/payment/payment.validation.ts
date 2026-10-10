import { z } from "zod";

const initiatePaymentSchema = z.object({
	applicationId: z.string().uuid("Invalid application ID"),
	amount: z.number().positive("Amount must be positive"),
	currency: z.string().length(3, "Currency must be 3 letters").default("BDT"),
});

const refundPaymentSchema = z.object({
	paymentId: z.string().min(1, "Payment ID (val_id) is required"),
	amount: z.number().positive("Amount must be positive"),
	reason: z.string().min(1, "Reason is required").max(255),
	tranId: z.string().min(1).optional(),
});

export const PaymentValidation = {
	initiatePaymentSchema,
	refundPaymentSchema,
};
