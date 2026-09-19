import { z } from "zod";

const initiatePaymentSchema = z.object({
	applicationId: z.string().uuid("Invalid application ID"),
	amount: z.number().positive("Amount must be positive"),
	currency: z.string().length(3, "Currency must be 3 letters").default("BDT"),
});

const bkashCallbackSchema = z.object({
	paymentId: z.string().min(1, "Payment ID is required"),
	status: z.enum(["success", "failure", "cancel"]),
});

const refundPaymentSchema = z.object({
	paymentId: z.string().min(1, "Payment ID is required"),
	amount: z.number().positive("Amount must be positive"),
	trxID: z.string().min(1).optional(),
	sku: z.string().min(1).max(255).optional(),
	reason: z.string().min(1, "Reason is required").max(255),
});

export const PaymentValidation = {
	initiatePaymentSchema,
	bkashCallbackSchema,
	refundPaymentSchema,
};
