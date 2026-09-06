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
	currency: z.string().length(3, "Currency must be 3 letters"),
	invoiceNumber: z.string().min(1, "Invoice number is required"),
	reason: z.string().min(1, "Reason is required"),
});

export const PaymentValidation = {
	initiatePaymentSchema,
	bkashCallbackSchema,
	refundPaymentSchema,
};
