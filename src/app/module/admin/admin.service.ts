import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IAdminUserFilters,
	IAdminUserListResponse,
	IAdminUserResponse,
	IUpdateUserRolePayload,
	IUpdateUserStatusPayload,
	IAdminStatsResponse,
	IAuditLogFilters,
	IAuditLogListResponse,
	ILandlordDashboardResponse,
	IPropertyManagerDashboardResponse,
} from "./admin.interface";
import {
	Role,
	UserStatus,
	ApplicationStatus,
	PaymentStatus,
	MaintenanceStatus,
} from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

const mapProfile = (
	profile: {
		phoneNumber: string | null;
		bio: string | null;
		avatarUrl: string | null;
	} | null,
) => {
	if (!profile) return null;
	return {
		phoneNumber: profile.phoneNumber ?? undefined,
		bio: profile.bio ?? undefined,
		avatarUrl: profile.avatarUrl ?? undefined,
	};
};

const getUsers = async (
	filters: IAdminUserFilters,
): Promise<IAdminUserListResponse> => {
	const {
		role,
		status,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.UserWhereInput[] = [{ deletedAt: null }];

	if (role) {
		andConditions.push({ role });
	}

	if (status) {
		andConditions.push({ status });
	}

	if (search) {
		andConditions.push({
			OR: [
				{ email: { contains: search, mode: "insensitive" } },
				{ name: { contains: search, mode: "insensitive" } },
			],
		});
	}

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where: {
				AND: andConditions.length > 0 ? andConditions : undefined,
			},
			include: {
				profile: {
					select: {
						phoneNumber: true,
						bio: true,
						avatarUrl: true,
					},
				},
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.user.count({
			where: {
				AND: andConditions,
			},
		}),
	]);

	return {
		data: users.map((user) => ({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			status: user.status,
			authProvider: user.authProvider,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			profile: mapProfile(user.profile),
		})) as IAdminUserResponse[],
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getUserById = async (id: string): Promise<IAdminUserResponse> => {
	const user = await prisma.user.findFirst({
		where: { id, deletedAt: null },
		include: {
			profile: {
				select: {
					phoneNumber: true,
					bio: true,
					avatarUrl: true,
				},
			},
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		status: user.status,
		authProvider: user.authProvider,
		emailVerified: user.emailVerified,
		createdAt: user.createdAt,
		profile: mapProfile(user.profile),
	};
};

const updateUserRole = async (
	id: string,
	payload: IUpdateUserRolePayload,
): Promise<IAdminUserResponse> => {
	const user = await prisma.user.findFirst({
		where: { id, deletedAt: null },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const updatedUser = await prisma.user.update({
		where: { id },
		data: { role: payload.role },
		include: {
			profile: {
				select: {
					phoneNumber: true,
					bio: true,
					avatarUrl: true,
				},
			},
		},
	});

	return {
		id: updatedUser.id,
		email: updatedUser.email,
		name: updatedUser.name,
		role: updatedUser.role,
		status: updatedUser.status,
		authProvider: updatedUser.authProvider,
		emailVerified: updatedUser.emailVerified,
		createdAt: updatedUser.createdAt,
		profile: mapProfile(updatedUser.profile),
	};
};

const updateUserStatus = async (
	id: string,
	payload: IUpdateUserStatusPayload,
): Promise<IAdminUserResponse> => {
	const user = await prisma.user.findFirst({
		where: { id, deletedAt: null },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const updatedUser = await prisma.user.update({
		where: { id },
		data: { status: payload.status },
		include: {
			profile: {
				select: {
					phoneNumber: true,
					bio: true,
					avatarUrl: true,
				},
			},
		},
	});

	return {
		id: updatedUser.id,
		email: updatedUser.email,
		name: updatedUser.name,
		role: updatedUser.role,
		status: updatedUser.status,
		authProvider: updatedUser.authProvider,
		emailVerified: updatedUser.emailVerified,
		createdAt: updatedUser.createdAt,
		profile: mapProfile(updatedUser.profile),
	};
};

const deleteUser = async (id: string): Promise<void> => {
	const user = await prisma.user.findFirst({
		where: { id, deletedAt: null },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	await prisma.user.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
};

const getStats = async (): Promise<IAdminStatsResponse> => {
	const [
		totalUsers,
		totalTenants,
		totalLandlords,
		totalAdmins,
		totalProperties,
		totalRooms,
		totalApplications,
		totalReviews,
		totalPayments,
		pendingApplications,
		completedPayments,
	] = await Promise.all([
		prisma.user.count({ where: { deletedAt: null } }),
		prisma.user.count({ where: { role: Role.TENANT, deletedAt: null } }),
		prisma.user.count({ where: { role: Role.LANDLORD, deletedAt: null } }),
		prisma.user.count({ where: { role: Role.ADMIN, deletedAt: null } }),
		prisma.property.count({ where: { deletedAt: null } }),
		prisma.room.count(),
		prisma.application.count(),
		prisma.review.count(),
		prisma.payment.count(),
		prisma.application.count({ where: { status: "PENDING" } }),
		prisma.payment.count({ where: { status: "COMPLETED" } }),
	]);

	return {
		totalUsers,
		totalTenants,
		totalLandlords,
		totalAdmins,
		totalProperties,
		totalRooms,
		totalApplications,
		totalReviews,
		totalPayments,
		pendingApplications,
		completedPayments,
	};
};

const getAuditLogs = async (
	filters: IAuditLogFilters,
): Promise<IAuditLogListResponse> => {
	const {
		action,
		entityType,
		userId,
		search,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.AuditLogWhereInput[] = [];

	if (action) {
		andConditions.push({ action: { contains: action, mode: "insensitive" } });
	}

	if (entityType) {
		andConditions.push({
			entityType: { contains: entityType, mode: "insensitive" },
		});
	}

	if (userId) {
		andConditions.push({ userId });
	}

	if (search) {
		andConditions.push({
			OR: [
				{ action: { contains: search, mode: "insensitive" } },
				{ entityType: { contains: search, mode: "insensitive" } },
				{ entityId: { contains: search, mode: "insensitive" } },
				{ user: { name: { contains: search, mode: "insensitive" } } },
				{ user: { email: { contains: search, mode: "insensitive" } } },
			],
		});
	}

	const [auditLogs, total] = await Promise.all([
		prisma.auditLog.findMany({
			where: {
				AND: andConditions.length > 0 ? andConditions : undefined,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.auditLog.count({
			where: {
				AND: andConditions,
			},
		}),
	]);

	return {
		data: auditLogs as IAuditLogListResponse["data"],
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getLandlordDashboard = async (
	landlordId: string,
): Promise<ILandlordDashboardResponse> => {
	// Get landlord's properties
	const properties = await prisma.property.findMany({
		where: { landlordId, deletedAt: null },
		select: { id: true },
	});

	const propertyIds = properties.map((p) => p.id);

	// Get buildings for these properties
	const buildings = await prisma.building.findMany({
		where: { propertyId: { in: propertyIds }, deletedAt: null },
		select: { id: true, propertyId: true },
	});

	const buildingIds = buildings.map((b) => b.id);

	// Get flats for these buildings
	const flats = await prisma.flat.findMany({
		where: { buildingId: { in: buildingIds }, deletedAt: null },
		select: { id: true, buildingId: true },
	});

	const flatIds = flats.map((f) => f.id);

	// Get rooms for these flats
	const rooms = await prisma.room.findMany({
		where: { flatId: { in: flatIds } },
		select: { id: true, flatId: true, name: true, price: true, isActive: true },
	});

	const roomIds = rooms.map((r) => r.id);

	// Get applications for these rooms
	const applications = await prisma.application.findMany({
		where: { roomId: { in: roomIds } },
		select: {
			id: true,
			roomId: true,
			status: true,
			tenantId: true,
			createdAt: true,
		},
	});

	// Get rents for these rooms
	const rents = await prisma.rent.findMany({
		where: { roomId: { in: roomIds } },
		select: {
			id: true,
			roomId: true,
			tenantId: true,
			amount: true,
			dueDate: true,
			status: true,
			periodStart: true,
			periodEnd: true,
		},
	});

	// Get maintenance requests for these rooms
	const maintenanceRequests = await prisma.maintenanceRequest.findMany({
		where: { roomId: { in: roomIds } },
		select: {
			id: true,
			roomId: true,
			title: true,
			priority: true,
			status: true,
			createdAt: true,
		},
	});

	// Calculate stats
	const totalProperties = propertyIds.length;
	const totalBuildings = buildingIds.length;
	const totalFlats = flatIds.length;
	const totalRooms = rooms.length;
	const activeRooms = rooms.filter((r) => r.isActive).length;
	const totalApplications = applications.length;
	const pendingApplications = applications.filter(
		(a) => a.status === ApplicationStatus.PENDING,
	).length;
	const acceptedApplications = applications.filter(
		(a) => a.status === ApplicationStatus.ACCEPTED,
	).length;

	// Calculate revenue from completed payments
	const payments = await prisma.payment.findMany({
		where: {
			applicationId: { in: applications.map((a) => a.id) },
			status: PaymentStatus.COMPLETED,
		},
		select: { amount: true, createdAt: true },
	});

	const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
	const currentMonth = new Date();
	currentMonth.setDate(1);
	currentMonth.setHours(0, 0, 0, 0);
	const monthlyRevenue = payments
		.filter((p) => p.createdAt >= currentMonth)
		.reduce((sum, p) => sum + p.amount, 0);

	const occupancyRate = totalRooms > 0 ? (activeRooms / totalRooms) * 100 : 0;

	// Recent applications (last 5)
	const recentApplications = applications
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, 5)
		.map((a) => {
			const room = rooms.find((r) => r.id === a.roomId);
			return {
				id: a.id,
				roomName: room?.name || "Unknown",
				tenantName: a.tenantId, // Would need tenant name from user
				status: a.status,
				createdAt: a.createdAt,
			};
		});

	// Upcoming rents (next 30 days)
	const thirtyDaysFromNow = new Date();
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
	const upcomingRents = rents
		.filter(
			(r) =>
				r.status !== "PAID" &&
				r.dueDate <= thirtyDaysFromNow &&
				r.dueDate >= new Date(),
		)
		.slice(0, 10)
		.map((r) => {
			const room = rooms.find((rm) => rm.id === r.roomId);
			return {
				id: r.id,
				tenantName: r.tenantId, // Would need tenant name
				roomName: room?.name || "Unknown",
				amount: r.amount,
				dueDate: r.dueDate,
				status: r.status,
			};
		});

	// Maintenance requests (open ones)
	const openMaintenance = maintenanceRequests
		.filter(
			(m) =>
				m.status !== MaintenanceStatus.CLOSED &&
				m.status !== MaintenanceStatus.RESOLVED,
		)
		.slice(0, 10)
		.map((m) => {
			const room = rooms.find((r) => r.id === m.roomId);
			return {
				id: m.id,
				roomName: room?.name || "Unknown",
				title: m.title,
				priority: m.priority,
				status: m.status,
				createdAt: m.createdAt,
			};
		});

	return {
		totalProperties,
		totalBuildings,
		totalFlats,
		totalRooms,
		activeRooms,
		totalApplications,
		pendingApplications,
		acceptedApplications,
		totalRevenue,
		monthlyRevenue,
		occupancyRate: Math.round(occupancyRate * 100) / 100,
		recentApplications,
		upcomingRents,
		maintenanceRequests: openMaintenance,
	};
};

const getPropertyManagerDashboard = async (
	managerId: string,
): Promise<IPropertyManagerDashboardResponse> => {
	// Get properties managed by this property manager
	// Assuming property manager is assigned to properties via a relation or through buildings
	// For now, we'll get all properties where the manager is the landlord (if they own properties)
	// Or we can add a managedBy field to Property model later
	const properties = await prisma.property.findMany({
		where: { landlordId: managerId, deletedAt: null },
		select: { id: true },
	});

	const propertyIds = properties.map((p) => p.id);

	const buildings = await prisma.building.findMany({
		where: { propertyId: { in: propertyIds }, deletedAt: null },
		select: { id: true, propertyId: true, name: true },
	});

	const buildingIds = buildings.map((b) => b.id);

	const flats = await prisma.flat.findMany({
		where: { buildingId: { in: buildingIds }, deletedAt: null },
		select: { id: true, buildingId: true },
	});

	const flatIds = flats.map((f) => f.id);

	const rooms = await prisma.room.findMany({
		where: { flatId: { in: flatIds } },
		select: { id: true, flatId: true, price: true, isActive: true, name: true },
	});

	const roomIds = rooms.map((r) => r.id);

	const applications = await prisma.application.findMany({
		where: { roomId: { in: roomIds } },
		select: {
			id: true,
			roomId: true,
			status: true,
			tenantId: true,
			createdAt: true,
		},
	});

	const rents = await prisma.rent.findMany({
		where: { roomId: { in: roomIds } },
		select: {
			id: true,
			roomId: true,
			tenantId: true,
			amount: true,
			dueDate: true,
			status: true,
		},
	});

	const maintenanceRequests = await prisma.maintenanceRequest.findMany({
		where: { roomId: { in: roomIds } },
		select: {
			id: true,
			roomId: true,
			title: true,
			priority: true,
			status: true,
			createdAt: true,
		},
	});

	const totalProperties = propertyIds.length;
	const totalRooms = rooms.length;
	const activeRooms = rooms.filter((r) => r.isActive).length;
	const totalApplications = applications.length;
	const pendingApplications = applications.filter(
		(a) => a.status === ApplicationStatus.PENDING,
	).length;

	const payments = await prisma.payment.findMany({
		where: {
			applicationId: { in: applications.map((a) => a.id) },
			status: PaymentStatus.COMPLETED,
		},
		select: { amount: true, createdAt: true },
	});

	const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
	const currentMonth = new Date();
	currentMonth.setDate(1);
	currentMonth.setHours(0, 0, 0, 0);
	const monthlyRevenue = payments
		.filter((p) => p.createdAt >= currentMonth)
		.reduce((sum, p) => sum + p.amount, 0);

	const thirtyDaysFromNow = new Date();
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

	const occupancyRate = totalRooms > 0 ? (activeRooms / totalRooms) * 100 : 0;

	// Get full property details for title lookup
	const fullProperties = await prisma.property.findMany({
		where: { id: { in: propertyIds } },
		select: { id: true, title: true },
	});

	// Recent applications with property info
	const recentApplications = applications
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, 5)
		.map((a) => {
			const room = rooms.find((r) => r.id === a.roomId);
			const flat = flats.find((f) => f.id === room?.flatId);
			const building = buildings.find((b) => b.id === flat?.buildingId);
			const property = fullProperties.find(
				(p) => p.id === building?.propertyId,
			);
			return {
				id: a.id,
				roomName: room?.name || "Unknown",
				propertyTitle: property?.title || "Unknown",
				tenantName: a.tenantId,
				status: a.status,
				createdAt: a.createdAt,
			};
		});

	const upcomingRents = rents
		.filter(
			(r) =>
				r.status !== "PAID" &&
				r.dueDate <= thirtyDaysFromNow &&
				r.dueDate >= new Date(),
		)
		.slice(0, 10)
		.map((r) => {
			const room = rooms.find((rm) => rm.id === r.roomId);
			const flat = flats.find((f) => f.id === room?.flatId);
			const building = buildings.find((b) => b.id === flat?.buildingId);
			const property = fullProperties.find(
				(p) => p.id === building?.propertyId,
			);
			return {
				id: r.id,
				tenantName: r.tenantId,
				roomName: room?.name || "Unknown",
				propertyTitle: property?.title || "Unknown",
				amount: r.amount,
				dueDate: r.dueDate,
				status: r.status,
			};
		});

	const openMaintenance = maintenanceRequests
		.filter(
			(m) =>
				m.status !== MaintenanceStatus.CLOSED &&
				m.status !== MaintenanceStatus.RESOLVED,
		)
		.slice(0, 10)
		.map((m) => {
			const room = rooms.find((r) => r.id === m.roomId);
			const flat = flats.find((f) => f.id === room?.flatId);
			const building = buildings.find((b) => b.id === flat?.buildingId);
			const property = fullProperties.find(
				(p) => p.id === building?.propertyId,
			);
			return {
				id: m.id,
				roomName: room?.name || "Unknown",
				propertyTitle: property?.title || "Unknown",
				title: m.title,
				priority: m.priority,
				status: m.status,
				createdAt: m.createdAt,
			};
		});

	return {
		managedProperties: totalProperties,
		totalRooms,
		activeRooms,
		totalApplications,
		pendingApplications,
		totalRevenue,
		monthlyRevenue,
		occupancyRate: Math.round(occupancyRate * 100) / 100,
		recentApplications,
		upcomingRents,
		maintenanceRequests: openMaintenance,
	};
};

// Helper to get user names for dashboard data
const getUserNames = async (
	userIds: string[],
): Promise<Record<string, string>> => {
	const users = await prisma.user.findMany({
		where: { id: { in: userIds } },
		select: { id: true, name: true },
	});
	return users.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {});
};

const getTenantNamesForDashboard = async (
	tenantIds: string[],
): Promise<Record<string, string>> => {
	const users = await prisma.user.findMany({
		where: { id: { in: tenantIds }, role: "TENANT" },
		select: { id: true, name: true },
	});
	return users.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {});
};

// Enhanced landlord dashboard with tenant names
const getLandlordDashboardWithNames = async (
	landlordId: string,
): Promise<ILandlordDashboardResponse> => {
	const dashboard = await getLandlordDashboard(landlordId);

	// Collect all tenant IDs
	const tenantIds = new Set<string>();
	dashboard.recentApplications.forEach((a) => tenantIds.add(a.tenantName));
	dashboard.upcomingRents.forEach((r) => tenantIds.add(r.tenantName));

	const tenantNames = await getTenantNamesForDashboard(Array.from(tenantIds));

	return {
		...dashboard,
		recentApplications: dashboard.recentApplications.map((a) => ({
			...a,
			tenantName: tenantNames[a.tenantName] || a.tenantName,
		})),
		upcomingRents: dashboard.upcomingRents.map((r) => ({
			...r,
			tenantName: tenantNames[r.tenantName] || r.tenantName,
		})),
	};
};

const getPropertyManagerDashboardWithNames = async (
	managerId: string,
): Promise<IPropertyManagerDashboardResponse> => {
	const dashboard = await getPropertyManagerDashboard(managerId);

	const tenantIds = new Set<string>();
	dashboard.recentApplications.forEach((a) => tenantIds.add(a.tenantName));
	dashboard.upcomingRents.forEach((r) => tenantIds.add(r.tenantName));

	const tenantNames = await getTenantNamesForDashboard(Array.from(tenantIds));

	return {
		...dashboard,
		recentApplications: dashboard.recentApplications.map((a) => ({
			...a,
			tenantName: tenantNames[a.tenantName] || a.tenantName,
		})),
		upcomingRents: dashboard.upcomingRents.map((r) => ({
			...r,
			tenantName: tenantNames[r.tenantName] || r.tenantName,
		})),
	};
};

export const AdminService = {
	getUsers,
	getUserById,
	updateUserRole,
	updateUserStatus,
	deleteUser,
	getStats,
	getAuditLogs,
	getLandlordDashboard: getLandlordDashboardWithNames,
	getPropertyManagerDashboard: getPropertyManagerDashboardWithNames,
};
