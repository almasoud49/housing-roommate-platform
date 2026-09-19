import type { Prisma } from "../../../generated/prisma/client";

export interface IInitiatePaymentPayload {
	applicationId: string;
	amount: number;
	currency?: string;
}

export interface IBkashPaymentResponse {
	id: string;
	applicationId: string;
	tenantId: string;
	amount: number;
	currency: string;
	status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
	bkashPaymentId?: string;
	bkashCreateResponse?: Prisma.JsonValue;
	bkashExecuteResponse?: Prisma.JsonValue;
	createdAt: Date;
	updatedAt: Date;
}

export interface IBkashCreatePaymentPayload {
	amount: number;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
	payerReference: string;
}

export interface IBkashExecutePaymentPayload {
	paymentId: string;
}

export interface IBkashQueryPaymentPayload {
	paymentId: string;
}

export interface IBkashRefundPayload {
	paymentId: string;
	amount: number;
	trxID?: string;
	sku?: string;
	reason: string;
}
