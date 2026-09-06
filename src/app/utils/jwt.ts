import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
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
		console.log("Token verification failed:", error);
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
	res: any,
	accessToken: string,
	refreshToken: string,
) => {
	const isProd = config.node_env === "production";
	const accessMaxAge = 24 * 60 * 60 * 1000; // 24 hours
	const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

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

const clearAuthCookies = (res: any) => {
	const isProd = config.node_env === "production";

	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
	});
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
	});
};

export const jwtUtils = {
	createToken,
	verifyToken,
	createTokens,
	setAuthCookies,
	clearAuthCookies,
};
