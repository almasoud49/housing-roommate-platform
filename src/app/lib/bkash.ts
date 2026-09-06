import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { redisManager } from "./redis";

export const getBkashIdToken = async () => {
	try {
		const IdTokenKey = "bkash:idToken";
		const RefreshTokenKey = "bkash:refreshToken";

		let bkashIdToken = await redisManager.get(IdTokenKey);
		const bkashIdTokenTTL = await redisManager.ttl(IdTokenKey);

		const bkashRefreshToken = await redisManager.get(RefreshTokenKey);
		const bkashRefreshTokenTTL = await redisManager.ttl(RefreshTokenKey);

		if (
			(bkashIdTokenTTL <= 600 || !bkashIdToken) &&
			bkashRefreshToken &&
			bkashRefreshTokenTTL > 600
		) {
			const refreshTokenResponse = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						username: config.bkash_username,
						password: config.bkash_password,
					},
					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: bkashRefreshToken,
					}),
				},
			);
			if (!refreshTokenResponse.ok) {
				throw new AppError(
					httpStatus.BAD_GATEWAY,
					"Bkash Access Token Grant Failed",
				);
			}

			const bkashRefreshTokenResult = await refreshTokenResponse.json();

			bkashIdToken = bkashRefreshTokenResult.id_token as string;

			await redisManager.set(IdTokenKey, bkashIdToken, {
				expiration: {
					type: "EX",
					value: 60 * 60,
				},
			});

			return bkashIdToken;
		}

		if (bkashIdTokenTTL > 600) {
			return bkashIdToken;
		}

		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);

		if (!response.ok) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				"Bkash Access Token Grant Failed",
			);
		}

		const result = await response.json();

		//bkash id token set
		await redisManager.set(IdTokenKey, result.id_token, {
			expiration: {
				type: "EX",
				value: 60 * 60, // 1hour
			},
		});

		//bkash refresh token set
		await redisManager.set(RefreshTokenKey, result.refresh_token, {
			expiration: {
				type: "EX",
				value: 60 * 60 * 24 * 28,
			},
		});

		bkashIdToken = result.id_token;

		return bkashIdToken;
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
