import httpStatus from "http-status";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import { type Role, UserStatus } from "../../generated/prisma/client";

export const assertUserStatus = (user: {
	status: UserStatus;
	deletedAt: Date | null;
}): void => {
	if (user.deletedAt) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Account not found");
	}
	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been blocked. Please contact support.",
		);
	}
};

export const assertRole = (userRole: Role, allowedRoles: Role[]): void => {
	if (!allowedRoles.includes(userRole)) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You don't have permission to perform this action",
		);
	}
};

export const assertNotDeleted = <T extends { deletedAt?: Date | null }>(
	resource: T | null,
	resourceName: string,
): T => {
	if (!resource) {
		throw new AppError(httpStatus.NOT_FOUND, `${resourceName} not found`);
	}
	if (resource.deletedAt) {
		throw new AppError(httpStatus.NOT_FOUND, `${resourceName} not found`);
	}
	return resource;
};

export const assertActiveRoom = async (roomId: string): Promise<void> => {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		select: { isActive: true },
	});

	if (!room) {
		throw new AppError(httpStatus.NOT_FOUND, "Room not found");
	}

	if (!room.isActive) {
		throw new AppError(httpStatus.BAD_REQUEST, "Room is not available");
	}
};

export const getLandlordProperties = async (
	landlordId: string,
): Promise<string[]> => {
	const properties = await prisma.property.findMany({
		where: { landlordId, deletedAt: null },
		select: { id: true },
	});
	return properties.map((p) => p.id);
};

export const getLandlordRooms = async (
	landlordId: string,
): Promise<string[]> => {
	const buildings = await prisma.building.findMany({
		where: { property: { landlordId, deletedAt: null } },
		select: { id: true },
	});

	const buildingIds = buildings.map((b) => b.id);

	const flats = await prisma.flat.findMany({
		where: { buildingId: { in: buildingIds }, deletedAt: null },
		select: { id: true },
	});

	const flatIds = flats.map((f) => f.id);

	const rooms = await prisma.room.findMany({
		where: { flatId: { in: flatIds } },
		select: { id: true },
	});

	return rooms.map((r) => r.id);
};

export const getLandlordApplications = async (
	landlordId: string,
): Promise<string[]> => {
	const roomIds = await getLandlordRooms(landlordId);

	const applications = await prisma.application.findMany({
		where: { roomId: { in: roomIds } },
		select: { id: true },
	});

	return applications.map((a) => a.id);
};
