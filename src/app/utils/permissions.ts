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
			return room?.flat.building.property.landlordId === userId;
		}
		case "application": {
			const application = await prisma.application.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			if (!application) return false;

			// Tenant owns their own applications
			if (application.tenantId === userId) return true;

			// Landlord/Property Manager owns applications for their rooms
			const room = await prisma.room.findUnique({
				where: { id: application.roomId },
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
			return room?.flat.building.property.landlordId === userId;
		}
		case "maintenanceRequest": {
			const request = await prisma.maintenanceRequest.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			if (!request) return false;

			if (request.tenantId === userId) return true;

			const room = await prisma.room.findUnique({
				where: { id: request.roomId },
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
			return room?.flat.building.property.landlordId === userId;
		}
		case "rent": {
			const rent = await prisma.rent.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			if (!rent) return false;

			if (rent.tenantId === userId) return true;

			const room = await prisma.room.findUnique({
				where: { id: rent.roomId },
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
			return room?.flat.building.property.landlordId === userId;
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
			return bill?.room.flat.building.property.landlordId === userId;
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
			return doc?.application.room.flat.building.property.landlordId === userId;
		}
		case "viewingRequest": {
			const request = await prisma.propertyViewingRequest.findUnique({
				where: { id: resourceId },
				select: { tenantId: true, roomId: true },
			});
			if (!request) return false;

			if (request.tenantId === userId) return true;

			const room = await prisma.room.findUnique({
				where: { id: request.roomId },
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
			return room?.flat.building.property.landlordId === userId;
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

export function canAccessResource(
	context: PermissionContext,
	action: PermissionAction,
	resourceType: ResourceType,
): Promise<boolean> {
	return hasPermission(context, action, resourceType);
}

export const PermissionUtils = {
	hasPermission,
	canAccessResource,
	checkResourceOwnership,
};
