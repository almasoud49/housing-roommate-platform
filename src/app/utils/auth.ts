import httpStatus from "http-status";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import { type Role, UserStatus } from "../../generated/prisma/client";

export const assertOwnership = async (
	userId: string,
	resourceType:
		| "property"
		| "building"
		| "flat"
		| "room"
		| "application"
		| "maintenanceRequest"
		| "rent"
		| "utilityBill"
		| "rentalDocument"
		| "viewingRequest",
	resourceId: string,
): Promise<void> => {
	let isOwner = false;

	switch (resourceType) {
		case "property": {
			const property = await prisma.property.findUnique({
				where: { id: resourceId },
				select: { landlordId: true },
			});
			isOwner = property?.landlordId === userId;
			break;
		}
		case "building": {
			const building = await prisma.building.findUnique({
				where: { id: resourceId },
				include: { property: { select: { landlordId: true } } },
			});
			isOwner = building?.property.landlordId === userId;
			break;
		}
		case "flat": {
			const flat = await prisma.flat.findUnique({
				where: { id: resourceId },
				include: {
					building: { include: { property: { select: { landlordId: true } } } },
				},
			});
			isOwner = flat?.building.property.landlordId === userId;
			break;
		}
		case "room": {
			const room = await prisma.room.findUnique({
				where: { id: resourceId },
				include: {
					flat: {
						include: {
							building: {
								include: { property: { select: { landlordId: true } } },
							},
						},
					},
				},
			});
			isOwner = room?.flat.building.property.landlordId === userId;
			break;
		}
		case "application": {
			const application = await prisma.application.findUnique({
				where: { id: resourceId },
				include: {
					room: {
						include: {
							flat: {
								include: {
									building: {
										include: { property: { select: { landlordId: true } } },
									},
								},
							},
						},
					},
				},
			});
			isOwner = application?.room.flat.building.property.landlordId === userId;
			break;
		}
		case "maintenanceRequest": {
			const request = await prisma.maintenanceRequest.findUnique({
				where: { id: resourceId },
				include: {
					room: {
						include: {
							flat: {
								include: {
									building: {
										include: { property: { select: { landlordId: true } } },
									},
								},
							},
						},
					},
				},
			});
			isOwner = request?.room.flat.building.property.landlordId === userId;
			break;
		}
		case "rent": {
			const rent = await prisma.rent.findUnique({
				where: { id: resourceId },
				include: {
					room: {
						include: {
							flat: {
								include: {
									building: {
										include: { property: { select: { landlordId: true } } },
									},
								},
							},
						},
					},
				},
			});
			isOwner = rent?.room.flat.building.property.landlordId === userId;
			break;
		}
		case "utilityBill": {
			const bill = await prisma.utilityBill.findUnique({
				where: { id: resourceId },
				include: {
					room: {
						include: {
							flat: {
								include: {
									building: {
										include: { property: { select: { landlordId: true } } },
									},
								},
							},
						},
					},
				},
			});
			isOwner = bill?.room.flat.building.property.landlordId === userId;
			break;
		}
		case "rentalDocument": {
			const doc = await prisma.rentalDocument.findUnique({
				where: { id: resourceId },
				include: {
					application: {
						include: {
							room: {
								include: {
									flat: {
										include: {
											building: {
												include: { property: { select: { landlordId: true } } },
											},
										},
									},
								},
							},
						},
					},
				},
			});
			isOwner =
				doc?.application.room.flat.building.property.landlordId === userId;
			break;
		}
		case "viewingRequest": {
			const request = await prisma.propertyViewingRequest.findUnique({
				where: { id: resourceId },
				include: {
					room: {
						include: {
							flat: {
								include: {
									building: {
										include: { property: { select: { landlordId: true } } },
									},
								},
							},
						},
					},
				},
			});
			isOwner = request?.room.flat.building.property.landlordId === userId;
			break;
		}
		default:
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`Unknown resource type: ${resourceType}`,
			);
	}

	if (!isOwner) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			`You don't have permission to access this ${resourceType}`,
		);
	}
};

export const assertTenantOwnership = async (
	userId: string,
	resourceType:
		| "application"
		| "maintenanceRequest"
		| "rent"
		| "utilityBillSplit"
		| "viewingRequest"
		| "roommateMatch"
		| "rentalDocument",
	resourceId: string,
): Promise<void> => {
	let isOwner = false;

	switch (resourceType) {
		case "application": {
			const application = await prisma.application.findUnique({
				where: { id: resourceId },
				select: { tenantId: true },
			});
			isOwner = application?.tenantId === userId;
			break;
		}
		case "maintenanceRequest": {
			const request = await prisma.maintenanceRequest.findUnique({
				where: { id: resourceId },
				select: { tenantId: true },
			});
			isOwner = request?.tenantId === userId;
			break;
		}
		case "rent": {
			const rent = await prisma.rent.findUnique({
				where: { id: resourceId },
				select: { tenantId: true },
			});
			isOwner = rent?.tenantId === userId;
			break;
		}
		case "utilityBillSplit": {
			const split = await prisma.utilityBillSplit.findUnique({
				where: { id: resourceId },
				select: { tenantId: true },
			});
			isOwner = split?.tenantId === userId;
			break;
		}
		case "viewingRequest": {
			const request = await prisma.propertyViewingRequest.findUnique({
				where: { id: resourceId },
				select: { tenantId: true },
			});
			isOwner = request?.tenantId === userId;
			break;
		}
		case "roommateMatch": {
			const match = await prisma.roommateMatch.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, matchedWithId: true },
			});
			isOwner = match?.tenantId === userId || match?.matchedWithId === userId;
			break;
		}
		case "rentalDocument": {
			const doc = await prisma.rentalDocument.findUnique({
				where: { id: resourceId },
				include: { application: { select: { tenantId: true } } },
			});
			isOwner = doc?.application.tenantId === userId;
			break;
		}
		default:
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`Unknown resource type: ${resourceType}`,
			);
	}

	if (!isOwner) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			`You don't have permission to access this ${resourceType}`,
		);
	}
};

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
