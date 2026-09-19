import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { redisManager } from "./redis";

const ID_TOKEN_KEY = "bkash:idToken";
const REFRESH_TOKEN_KEY = "bkash:refreshToken";
const REFRESH_THRESHOLD_SECONDS = 600;
const ID_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 28; // 28 days

interface BkashTokenResponse {
	id_token: string;
	refresh_token?: string;
}

const bkashHeaders = () => ({
	"Content-Type": "application/json",
	Accept: "application/json",
	username: config.bkash_username,
	password: config.bkash_password,
});

const requestBkashToken = async (
	endpoint:
		| "/tokenized/checkout/token/grant"
		| "/tokenized/checkout/token/refresh",
	body: Record<string, string>,
): Promise<BkashTokenResponse> => {
	const response = await fetch(`${config.bkash_base_url}${endpoint}`, {
		method: "POST",
		headers: bkashHeaders(),
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`Bkash token request failed: ${errorBody}`,
		);
	}

	const data = (await response.json()) as BkashTokenResponse;
	if (!data.id_token) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"Bkash token response missing id_token",
		);
	}
	return data;
};

export const clearBkashTokens = async (): Promise<void> => {
	await Promise.all([
		redisManager.del(ID_TOKEN_KEY),
		redisManager.del(REFRESH_TOKEN_KEY),
	]);
};

const isPlausibleIdToken = (token: string): boolean => {
	// Real bKash id_tokens are long JWT-like strings. A short base64 stub
	// (e.g. the 44-char value seen in gateway SigV4 errors) means a stale /
	// corrupt cache entry — never send it, force a fresh grant.
	if (!token || token.length < 100) return false;
	return true;
};

export const getBkashIdToken = async (): Promise<string> => {
	try {
		const [cachedToken, cachedTTL, refreshToken, refreshTTL] =
			await Promise.all([
				redisManager.get(ID_TOKEN_KEY),
				redisManager.ttl(ID_TOKEN_KEY),
				redisManager.get(REFRESH_TOKEN_KEY),
				redisManager.ttl(REFRESH_TOKEN_KEY),
			]);

		if (
			refreshToken &&
			refreshTTL > REFRESH_THRESHOLD_SECONDS &&
			(cachedTTL <= REFRESH_THRESHOLD_SECONDS || !cachedToken)
		) {
			const refreshed = await requestBkashToken(
				"/tokenized/checkout/token/refresh",
				{
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
					refresh_token: refreshToken,
				},
			);
			await redisManager.set(ID_TOKEN_KEY, refreshed.id_token, {
				EX: ID_TOKEN_TTL_SECONDS,
			});
			if (refreshed.refresh_token) {
				await redisManager.set(REFRESH_TOKEN_KEY, refreshed.refresh_token, {
					EX: REFRESH_TOKEN_TTL_SECONDS,
				});
			}
			return refreshed.id_token;
		}

		if (cachedToken && cachedTTL > REFRESH_THRESHOLD_SECONDS) {
			if (isPlausibleIdToken(cachedToken)) {
				return cachedToken;
			}
			// Corrupt/stale cache entry — drop it and fall through to grant.
			await clearBkashTokens();
		}

		const granted = await requestBkashToken("/tokenized/checkout/token/grant", {
			app_key: config.bkash_app_key,
			app_secret: config.bkash_app_secret,
		});
		await redisManager.set(ID_TOKEN_KEY, granted.id_token, {
			EX: ID_TOKEN_TTL_SECONDS,
		});
		if (granted.refresh_token) {
			await redisManager.set(REFRESH_TOKEN_KEY, granted.refresh_token, {
				EX: REFRESH_TOKEN_TTL_SECONDS,
			});
		}
		return granted.id_token;
	} catch (error: unknown) {
		if (error instanceof AppError) {
			throw error;
		}
		if (error instanceof Error) {
			throw new AppError(httpStatus.BAD_GATEWAY, error.message);
		}
		throw new AppError(httpStatus.BAD_GATEWAY, "Unknown error occurred");
	}
};
