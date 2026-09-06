import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import { type Role, UserStatus } from "../../generated/prisma/client";

export interface RequestUser {
	email: string;
	name: string;
	userId: string;
	role: Role;
}

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}

export const auth = (...requiredRoles: Role[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const token = req.cookies.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization?.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"You are not logged in. Please log in to access this resource.",
			);
		}

		const accessSecret = config.jwt_access_secret;
		const refreshSecret = config.jwt_refresh_secret;
		if (!accessSecret || !refreshSecret) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"JWT secrets not configured",
			);
		}

		const verifiedToken = jwtUtils.verifyToken(token, accessSecret);

		if (!verifiedToken.success) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				verifiedToken.error || "Token verification failed",
			);
		}

		const { email, name, userId, role } = verifiedToken.data as JwtPayload;

		if (requiredRoles.length && !requiredRoles.includes(role)) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Forbidden. You don't have permission to access this resource.",
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
				email,
				name,
				role,
			},
		});

		if (!user) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"User not found. Please log in again.",
			);
		}

		if (user.status === UserStatus.BLOCKED) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been blocked. Please contact support.",
			);
		}

		req.user = {
			email,
			name,
			userId,
			role,
		};

		next();
	});
};
