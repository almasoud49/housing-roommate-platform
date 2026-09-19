import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { Response } from "express";
import config from "../config";

interface TokenPayload extends JwtPayload {
	userId: string;
	email: string;
	name: string;
	role: string;
}

const createToken = (
	payload: TokenPayload,
	secret: string,
	expiresIn: SignOptions["expiresIn"],
) => {
	const token = jwt.sign(payload, secret, {
		expiresIn,
	} as SignOptions);

	return token;
};

const verifyToken = (token: string, secret: string) => {
	try {
		const verifiedToken = jwt.verify(token, secret);
		return {
			success: true,
			data: verifiedToken,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
};

const createTokens = (payload: TokenPayload) => {
	const accessToken = createToken(
		payload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions["expiresIn"],
	);

	const refreshToken = createToken(
		payload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions["expiresIn"],
	);

	return { accessToken, refreshToken };
};

const setAuthCookies = (
	res: Response,
	accessToken: string,
	refreshToken: string,
) => {
	const isProd = config.node_env === "production";
	const accessMaxAge = parseDuration(config.jwt_access_expires_in);
	const refreshMaxAge = parseDuration(config.jwt_refresh_expires_in);

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
		maxAge: accessMaxAge,
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
		maxAge: refreshMaxAge,
	});
};

const clearAuthCookies = (res: Response) => {
	const isProd = config.node_env === "production";

	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
		maxAge: 0,
	});
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
		maxAge: 0,
	});
};

function parseDuration(expiresIn: string): number {
	const match = expiresIn.match(/^(\d+)([smhd])$/);
	if (!match) return 24 * 60 * 60 * 1000;
	const value = Number(match[1]);
	switch (match[2]) {
		case "s":
			return value * 1000;
		case "m":
			return value * 60 * 1000;
		case "h":
			return value * 60 * 60 * 1000;
		case "d":
			return value * 24 * 60 * 60 * 1000;
		default:
			return 24 * 60 * 60 * 1000;
	}
}

export const jwtUtils = {
	createToken,
	verifyToken,
	createTokens,
	setAuthCookies,
	clearAuthCookies,
};
