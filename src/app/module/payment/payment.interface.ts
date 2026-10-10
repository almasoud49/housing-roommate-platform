import type { Prisma } from "../../../generated/prisma/client";

export interface IInitiatePaymentPayload {
	applicationId: string;
	amount: number;
	currency?: string;
}

/** Payment record as returned to the API client (SSLCommerz only). */
export interface IPaymentResponse {
	id: string;
	applicationId: string;
	tenantId: string;
	amount: number;
	currency: string;
	status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
	sslCommerzTranId?: string;
	sslCommerzValId?: string;
	sslCommerzCreateResponse?: Prisma.JsonValue;
	sslCommerzValidateResponse?: Prisma.JsonValue;
	createdAt: Date;
	updatedAt: Date;
}

/** Redirect params from the SSLCommerz success/fail/cancel URLs. */
export interface ISslcommerzCallbackParams {
	tran_id: string;
	status: "VALID" | "FAILED" | "CANCELLED";
	val_id?: string;
}

/** SSLCommerz refunds are keyed by val_id (paymentId) with an optional tran_id. */
export interface IRefundPayload {
	paymentId: string;
	amount: number;
	reason: string;
	tranId?: string;
}
