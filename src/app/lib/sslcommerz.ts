import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";

/** Raw response of POST /gwprocess/v4/api/process (initiation). */
export interface SslcommerzInitiationResponse {
	status: string;
	GatewayPageURL?: string;
	sessionkey?: string;
	tran_id?: string;
	failedreason?: string;
	[field: string]: unknown;
}

/** Raw response of GET /validator/api/validationserverAPI (validation). */
export interface SslcommerzValidationResponse {
	status: string;
	tran_id?: string;
	val_id?: string;
	amount?: string;
	card_type?: string;
	[field: string]: unknown;
}

/** Raw response of POST /validator/api/merchantTransRefund (refund). */
export interface SslcommerzRefundResponse {
	status?: string;
	refund_reference_id?: string;
	[field: string]: unknown;
}

const postJson = async (
	endpoint: string,
	body: Record<string, unknown>,
	errorPrefix: string,
): Promise<unknown> => {
	const response = await fetch(`${config.sslcommerz_base_url}${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new AppError(httpStatus.BAD_GATEWAY, `${errorPrefix}: ${error}`);
	}

	return response.json();
};

/**
 * Initiate a gateway session. The caller redirects the tenant to
 * `GatewayPageURL`; SSLCommerz then redirects back to the
 * success/fail/cancel URLs with ?status=&tran_id=&val_id=.
 */
export const initiateSslcommerzSession = async (params: {
	tranId: string;
	amount: number;
	currency: string;
	customer: { name: string; email: string; phone: string };
	metadata?: Record<string, string>;
}): Promise<SslcommerzInitiationResponse> => {
	const body = await postJson(
		"/gwprocess/v4/api/process",
		{
			store_id: config.sslcommerz_store_id,
			store_passwd: config.sslcommerz_store_passwd,
			total_amount: params.amount.toString(),
			currency: params.currency,
			tran_id: params.tranId,
			success_url: config.sslcommerz_success_url,
			fail_url: config.sslcommerz_fail_url,
			cancel_url: config.sslcommerz_cancel_url,
			cus_name: params.customer.name,
			cus_email: params.customer.email,
			cus_phone: params.customer.phone,
			cus_add1: "Dhaka",
			cus_city: "Dhaka",
			cus_country: "Bangladesh",
			shipping_method: "NO",
			product_name: "Rent payment",
			product_category: "Housing",
			product_profile: "general",
			...(params.metadata ?? {}),
		},
		"SSLCommerz initiation error",
	);

	const result = body as SslcommerzInitiationResponse;
	if (result.status !== "SUCCESS" || !result.GatewayPageURL) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`SSLCommerz initiation failed: ${result.failedreason ?? "no GatewayPageURL"}`,
		);
	}
	return result;
};

/**
 * Server-to-server validation of a completed session. The redirect
 * query params alone are NOT trusted — always validate here first.
 */
export const validateSslcommerzPayment = async (
	valId: string,
): Promise<SslcommerzValidationResponse> => {
	const url = new URL(
		`${config.sslcommerz_base_url}/validator/api/validationserverAPI`,
	);
	url.searchParams.set("val_id", valId);
	url.searchParams.set("store_id", config.sslcommerz_store_id);
	url.searchParams.set("store_passwd", config.sslcommerz_store_passwd);

	const response = await fetch(url.toString());
	if (!response.ok) {
		const error = await response.text();
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`SSLCommerz validation error: ${error}`,
		);
	}

	return (await response.json()) as SslcommerzValidationResponse;
};

/** Refund a completed payment, keyed by val_id (tran_id optional). */
export const refundSslcommerzPayment = async (params: {
	valId: string;
	tranId?: string;
	amount: number;
	reason: string;
}): Promise<SslcommerzRefundResponse> => {
	const body = await postJson(
		"/validator/api/merchantTransRefund",
		{
			store_id: config.sslcommerz_store_id,
			store_passwd: config.sslcommerz_store_passwd,
			val_id: params.valId,
			...(params.tranId ? { tran_id: params.tranId } : {}),
			refund_reference_id: `RF-${params.valId}-${Date.now().toString(36)}`,
			refund_amount: params.amount.toString(),
			refund_reason: params.reason,
		},
		"SSLCommerz refund error",
	);

	return body as SslcommerzRefundResponse;
};
