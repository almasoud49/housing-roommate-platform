import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	INotificationFilters,
	INotificationListResponse,
	INotificationResponse,
} from "./notification.interface";
import { buildMeta } from "../../utils/query";

const getMyNotifications = async (
	userId: string,
	filters: INotificationFilters,
): Promise<INotificationListResponse> => {
	const {
		type,
		isRead,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.NotificationWhereInput[] = [{ userId }];

	if (type) andConditions.push({ type });
	if (typeof isRead === "boolean") andConditions.push({ isRead });

	const where = { AND: andConditions };

	const [notifications, total, unreadCount] = await Promise.all([
		prisma.notification.findMany({
			where,
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.notification.count({ where }),
		prisma.notification.count({ where: { userId, isRead: false } }),
	]);

	return {
		data: notifications as unknown as INotificationResponse[],
		meta: {
			...buildMeta(page, limit, total),
			unreadCount,
		},
	};
};

const getUnreadCount = async (
	userId: string,
): Promise<{ unreadCount: number }> => {
	const unreadCount = await prisma.notification.count({
		where: { userId, isRead: false },
	});

	return { unreadCount };
};

const markAsRead = async (
	id: string,
	userId: string,
): Promise<INotificationResponse> => {
	const notification = await prisma.notification.findFirst({
		where: { id, userId },
	});

	if (!notification) {
		throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
	}

	const updated = await prisma.notification.update({
		where: { id },
		data: { isRead: true, readAt: new Date() },
	});

	return updated as unknown as INotificationResponse;
};

const markAllAsRead = async (userId: string): Promise<{ updated: number }> => {
	const result = await prisma.notification.updateMany({
		where: { userId, isRead: false },
		data: { isRead: true, readAt: new Date() },
	});

	return { updated: result.count };
};

const deleteNotification = async (
	id: string,
	userId: string,
): Promise<void> => {
	const notification = await prisma.notification.findFirst({
		where: { id, userId },
	});

	if (!notification) {
		throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
	}

	await prisma.notification.delete({ where: { id } });
};

export const NotificationService = {
	getMyNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
};
