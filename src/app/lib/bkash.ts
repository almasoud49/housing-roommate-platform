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
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			"Bkash Access Token Grant Failed",
		);
	}

	return (await response.json()) as BkashTokenResponse;
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
			return refreshed.id_token;
		}

		if (cachedTTL > REFRESH_THRESHOLD_SECONDS) {
			return cachedToken as string;
		}

		const granted = await requestBkashToken("/tokenized/checkout/token/grant", {
			app_key: config.bkash_app_key,
			app_secret: config.bkash_app_secret,
		});
		await redisManager.set(ID_TOKEN_KEY, granted.id_token, {
			EX: ID_TOKEN_TTL_SECONDS,
		});
		await redisManager.set(REFRESH_TOKEN_KEY, granted.refresh_token ?? "", {
			EX: REFRESH_TOKEN_TTL_SECONDS,
		});
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
