import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendOk, sendPaginated } from "../../utils/sendResponse";
import type { INotificationFilters } from "./notification.interface";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const filters: INotificationFilters = {
		type: (req.query.type as INotificationFilters["type"]) || undefined,
		isRead:
			req.query.isRead !== undefined ? req.query.isRead === "true" : undefined,
		...parseListParams(req.query),
	};

	const result = await NotificationService.getMyNotifications(userId, filters);

	sendPaginated(
		res,
		"Notifications retrieved successfully",
		result.data,
		result.meta,
	);
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await NotificationService.getUnreadCount(userId);

	sendOk(res, "Unread count retrieved successfully", result);
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };

	const result = await NotificationService.markAsRead(id, userId);

	sendOk(res, "Notification marked as read", result);
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await NotificationService.markAllAsRead(userId);

	sendOk(res, "All notifications marked as read", result);
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const { id } = req.params as { id: string };

	await NotificationService.deleteNotification(id, userId);

	sendOk(res, "Notification deleted successfully", null);
});

export const NotificationController = {
	getMyNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
};
