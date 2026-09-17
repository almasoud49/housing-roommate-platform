import { Role } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export type ResourceType =
	| "property"
	| "building"
	| "flat"
	| "room"
	| "application"
	| "user"
	| "maintenanceRequest"
	| "rent"
	| "utilityBill"
	| "rentalDocument"
	| "viewingRequest"
	| "roommateMatch"
	| "notification";

export interface PermissionContext {
	userId: string;
	role: Role;
	resourceId?: string;
	resourceType?: ResourceType;
}

export type PermissionAction =
	| "create"
	| "read"
	| "update"
	| "delete"
	| "manage"
	| "view"
	| "approve"
	| "reject";

export interface PermissionRule {
	action: PermissionAction;
	resourceType: ResourceType;
	allowedRoles: Role[];
	checkOwnership?: boolean;
	customCheck?: (context: PermissionContext) => Promise<boolean>;
}

const permissionRules: PermissionRule[] = [
	// Property permissions
	{
		action: "create",
		resourceType: "property",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
	},
	{
		action: "read",
		resourceType: "property",
		allowedRoles: [
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
			Role.TENANT,
		],
		checkOwnership: false,
	},
	{
		action: "update",
		resourceType: "property",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "property",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "manage",
		resourceType: "property",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},

	// Building permissions
	{
		action: "create",
		resourceType: "building",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
	},
	{
		action: "read",
		resourceType: "building",
		allowedRoles: [
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
			Role.TENANT,
		],
		checkOwnership: false,
	},
	{
		action: "update",
		resourceType: "building",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "building",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},

	// Flat permissions
	{
		action: "create",
		resourceType: "flat",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
	},
	{
		action: "read",
		resourceType: "flat",
		allowedRoles: [
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
			Role.TENANT,
		],
		checkOwnership: false,
	},
	{
		action: "update",
		resourceType: "flat",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "flat",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},

	// Room permissions
	{
		action: "create",
		resourceType: "room",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
	},
	{
		action: "read",
		resourceType: "room",
		allowedRoles: [
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
			Role.TENANT,
		],
		checkOwnership: false,
	},
	{
		action: "update",
		resourceType: "room",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "room",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},

	// Application permissions
	{
		action: "create",
		resourceType: "application",
		allowedRoles: [Role.TENANT],
	},
	{
		action: "read",
		resourceType: "application",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "application",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "approve",
		resourceType: "application",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "reject",
		resourceType: "application",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "application",
		allowedRoles: [Role.TENANT, Role.ADMIN],
		checkOwnership: true,
	},

	// Maintenance Request permissions
	{
		action: "create",
		resourceType: "maintenanceRequest",
		allowedRoles: [Role.TENANT],
	},
	{
		action: "read",
		resourceType: "maintenanceRequest",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "maintenanceRequest",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "maintenanceRequest",
		allowedRoles: [Role.LANDLORD, Role.ADMIN],
		checkOwnership: true,
	},

	// Rent permissions
	{
		action: "read",
		resourceType: "rent",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "rent",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},

	// Utility Bill permissions
	{
		action: "create",
		resourceType: "utilityBill",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
	},
	{
		action: "read",
		resourceType: "utilityBill",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "utilityBill",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},

	// Rental Document permissions
	{
		action: "create",
		resourceType: "rentalDocument",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
	},
	{
		action: "read",
		resourceType: "rentalDocument",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "rentalDocument",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},

	// Viewing Request permissions
	{
		action: "create",
		resourceType: "viewingRequest",
		allowedRoles: [Role.TENANT],
	},
	{
		action: "read",
		resourceType: "viewingRequest",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "viewingRequest",
		allowedRoles: [Role.LANDLORD, Role.PROPERTY_MANAGER, Role.ADMIN],
		checkOwnership: true,
	},

	// Roommate Match permissions
	{
		action: "create",
		resourceType: "roommateMatch",
		allowedRoles: [Role.TENANT],
	},
	{
		action: "read",
		resourceType: "roommateMatch",
		allowedRoles: [Role.TENANT, Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "roommateMatch",
		allowedRoles: [Role.TENANT, Role.ADMIN],
		checkOwnership: true,
	},

	// Notification permissions
	{
		action: "read",
		resourceType: "notification",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "notification",
		allowedRoles: [
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
			Role.ADMIN,
		],
		checkOwnership: true,
	},

	// User permissions
	{
		action: "read",
		resourceType: "user",
		allowedRoles: [Role.ADMIN],
		checkOwnership: true,
	},
	{
		action: "update",
		resourceType: "user",
		allowedRoles: [
			Role.ADMIN,
			Role.TENANT,
			Role.LANDLORD,
			Role.PROPERTY_MANAGER,
		],
		checkOwnership: true,
	},
	{
		action: "delete",
		resourceType: "user",
		allowedRoles: [Role.ADMIN],
		checkOwnership: true,
	},
];

const roomLandlordInclude = {
	flat: {
		include: {
			building: { include: { property: { select: { landlordId: true } } } },
		},
	},
};

const landlordIdOfRoom = async (
	roomId: string,
): Promise<string | undefined> => {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: roomLandlordInclude,
	});
	return room?.flat.building.property.landlordId;
};

// Records that carry { tenantId, roomId }: owned when the record belongs
// to the tenant, otherwise when the record's room belongs to the landlord.
const ownsViaTenantOrRoom = async (
	record: { tenantId: string; roomId: string } | null,
	userId: string,
): Promise<boolean> => {
	if (!record) return false;
	if (record.tenantId === userId) return true;
	return (await landlordIdOfRoom(record.roomId)) === userId;
};

async function checkResourceOwnership(
	userId: string,
	resourceType: ResourceType,
	resourceId: string,
	role: Role,
): Promise<boolean> {
	switch (resourceType) {
		case "property": {
			const property = await prisma.property.findUnique({
				where: { id: resourceId },
				select: { landlordId: true },
			});
			return property?.landlordId === userId;
		}
		case "building": {
			const building = await prisma.building.findUnique({
				where: { id: resourceId },
				include: { property: { select: { landlordId: true } } },
			});
			return building?.property.landlordId === userId;
		}
		case "flat": {
			const flat = await prisma.flat.findUnique({
				where: { id: resourceId },
				include: {
					building: { include: { property: { select: { landlordId: true } } } },
				},
			});
			return flat?.building.property.landlordId === userId;
		}
		case "room": {
			return (await landlordIdOfRoom(resourceId)) === userId;
		}
		case "application": {
			const application = await prisma.application.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			return ownsViaTenantOrRoom(application, userId);
		}
		case "maintenanceRequest": {
			const request = await prisma.maintenanceRequest.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			return ownsViaTenantOrRoom(request, userId);
		}
		case "rent": {
			const rent = await prisma.rent.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			return ownsViaTenantOrRoom(rent, userId);
		}
		case "utilityBill": {
			const bill = await prisma.utilityBill.findUnique({
				where: { id: resourceId },
				select: { roomId: true },
			});
			if (!bill) return false;
			return (await landlordIdOfRoom(bill.roomId)) === userId;
		}
		case "rentalDocument": {
			const doc = await prisma.rentalDocument.findUnique({
				where: { id: resourceId },
				select: { application: { select: { roomId: true } } },
			});
			if (!doc) return false;
			return (await landlordIdOfRoom(doc.application.roomId)) === userId;
		}
		case "viewingRequest": {
			const request = await prisma.propertyViewingRequest.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			return ownsViaTenantOrRoom(request, userId);
		}
		case "roommateMatch": {
			const match = await prisma.roommateMatch.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, matchedWithId: true },
			});
			if (!match) return false;

			return match.tenantId === userId || match.matchedWithId === userId;
		}
		case "notification": {
			const notification = await prisma.notification.findUnique({
				where: { id: resourceId },
				select: { userId: true },
			});
			return notification?.userId === userId;
		}
		case "user": {
			return userId === resourceId;
		}
		default:
			return false;
	}
}

export async function hasPermission(
	context: PermissionContext,
	action: PermissionAction,
	resourceType: ResourceType,
): Promise<boolean> {
	const { userId, role } = context;

	// Admin has access to everything
	if (role === Role.ADMIN) {
		return true;
	}

	// Find matching permission rule
	const rule = permissionRules.find(
		(r) => r.action === action && r.resourceType === resourceType,
	);

	if (!rule) {
		return false;
	}

	// Check if role is allowed
	if (!rule.allowedRoles.includes(role)) {
		return false;
	}

	// Check ownership if required
	if (rule.checkOwnership && context.resourceId) {
		const isOwner = await checkResourceOwnership(
			userId,
			resourceType,
			context.resourceId,
			role,
		);
		if (!isOwner) {
			return false;
		}
	}

	// Run custom check if provided
	if (rule.customCheck) {
		return rule.customCheck(context);
	}

	return true;
}

export const PermissionUtils = {
	hasPermission,
	checkResourceOwnership,
};
