import type { Role, UserStatus } from "../../../generated/prisma/client";

export interface IUpdateUserRolePayload {
	role: Role;
}

export interface IUpdateUserStatusPayload {
	status: UserStatus;
}

export interface IAdminUserFilters {
	role?: Role;
	status?: UserStatus;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IAdminUserResponse {
	id: string;
	email: string;
	name: string;
	role: Role;
	status: UserStatus;
	authProvider: string;
	emailVerified: boolean;
	createdAt: Date;
	profile?: {
		phoneNumber?: string;
		bio?: string;
		avatarUrl?: string;
	} | null;
}

export interface IAdminUserListResponse {
	data: IAdminUserResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface IAdminStatsResponse {
	totalUsers: number;
	totalTenants: number;
	totalLandlords: number;
	totalAdmins: number;
	totalProperties: number;
	totalRooms: number;
	totalApplications: number;
	totalReviews: number;
	totalPayments: number;
	pendingApplications: number;
	completedPayments: number;
}

export interface ILandlordDashboardResponse {
	totalProperties: number;
	totalBuildings: number;
	totalFlats: number;
	totalRooms: number;
	activeRooms: number;
	totalApplications: number;
	pendingApplications: number;
	acceptedApplications: number;
	totalRevenue: number;
	monthlyRevenue: number;
	occupancyRate: number;
	recentApplications: Array<{
		id: string;
		roomName: string;
		tenantName: string;
		status: string;
		createdAt: Date;
	}>;
	upcomingRents: Array<{
		id: string;
		tenantName: string;
		roomName: string;
		amount: number;
		dueDate: Date;
		status: string;
	}>;
	maintenanceRequests: Array<{
		id: string;
		roomName: string;
		title: string;
		priority: string;
		status: string;
		createdAt: Date;
	}>;
}

export interface IPropertyManagerDashboardResponse {
	managedProperties: number;
	totalRooms: number;
	activeRooms: number;
	totalApplications: number;
	pendingApplications: number;
	totalRevenue: number;
	monthlyRevenue: number;
	occupancyRate: number;
	recentApplications: Array<{
		id: string;
		roomName: string;
		propertyTitle: string;
		tenantName: string;
		status: string;
		createdAt: Date;
	}>;
	upcomingRents: Array<{
		id: string;
		tenantName: string;
		roomName: string;
		propertyTitle: string;
		amount: number;
		dueDate: Date;
		status: string;
	}>;
	maintenanceRequests: Array<{
		id: string;
		roomName: string;
		propertyTitle: string;
		title: string;
		priority: string;
		status: string;
		createdAt: Date;
	}>;
}

export interface IAuditLogFilters {
	action?: string;
	entityType?: string;
	userId?: string;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IAuditLogResponse {
	id: string;
	userId: string;
	action: string;
	entityType: string;
	entityId: string;
	oldData?: Record<string, unknown>;
	newData?: Record<string, unknown>;
	createdAt: Date;
	user?: {
		id: string;
		name: string;
		email: string;
	};
}

export interface IAuditLogListResponse {
	data: IAuditLogResponse[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
