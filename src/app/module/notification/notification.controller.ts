import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
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

const writeSseEvent = (
	res: Response,
	event: string,
	data: unknown,
	id?: string,
) => {
	if (id) res.write(`id: ${id}\n`);
	res.write(`event: ${event}\n`);
	res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Serverless-safe realtime: SSE over plain HTTP (no persistent TCP like
// Socket.io, no paid Pusher/Ably). Vercel functions time out, so the
// client auto-reconnects with Last-Event-ID and we replay missed rows.
const streamNotifications = async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache, no-transform");
	res.setHeader("Connection", "keep-alive");
	res.setHeader("X-Accel-Buffering", "no");
	res.flushHeaders?.();

	req.socket?.setTimeout?.(0);
	req.socket?.setKeepAlive?.(true);

	let since: Date | null = null;
	const lastEventId = req.headers["last-event-id"];
	const sinceQuery =
		typeof req.query.since === "string" ? req.query.since : undefined;
	if (typeof lastEventId === "string" && lastEventId) {
		// Event IDs are notification.createdAt ISO strings (see below).
		const parsed = new Date(lastEventId);
		if (!Number.isNaN(parsed.getTime())) since = parsed;
	} else if (sinceQuery) {
		const parsed = new Date(sinceQuery);
		if (!Number.isNaN(parsed.getTime())) since = parsed;
	} else if (typeof req.query.afterId === "string" && req.query.afterId) {
		try {
			const anchor = await prisma.notification.findFirst({
				where: { id: req.query.afterId as string, userId },
				select: { createdAt: true },
			});
			if (anchor) since = anchor.createdAt;
		} catch {
			// Headers already sent — fall back to full sync, keep stream alive.
		}
	}

	let lastUnreadCount: number | null = null;
	let lastSeenAt: Date | null = since;
	let closed = false;

	const pushUpdates = async () => {
		if (closed) return;
		try {
			const { notifications, unreadCount } =
				await NotificationService.getUpdatesSince(userId, lastSeenAt);
			if (unreadCount !== lastUnreadCount) {
				writeSseEvent(res, "unread-count", { unreadCount });
				lastUnreadCount = unreadCount;
			}
			for (const n of notifications) {
				writeSseEvent(res, "notification", n, n.createdAt.toISOString());
				lastSeenAt = n.createdAt;
			}
		} catch {
			// Next tick retries; keep stream alive for transient DB errors.
		}
	};

	writeSseEvent(res, "connected", { ok: true });
	await pushUpdates();

	const pollMs = 10_000;
	const heartbeatMs = 25_000;
	const pollTimer = setInterval(pushUpdates, pollMs);
	const heartbeatTimer = setInterval(() => {
		if (!closed) res.write(": heartbeat\n\n");
	}, heartbeatMs);

	req.on("close", () => {
		closed = true;
		clearInterval(pollTimer);
		clearInterval(heartbeatTimer);
	});
};

export const NotificationController = {
	getMyNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	streamNotifications,
};
