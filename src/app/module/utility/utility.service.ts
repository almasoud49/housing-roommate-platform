import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IBillFilters,
	IBillListResponse,
	IBillResponse,
	IBillSplitResponse,
	ICreateBillPayload,
	IUpdateBillPayload,
	IUpdateBillStatusPayload,
} from "./utility.interface";
import { buildMeta } from "../../utils/query";

const tenantSelect = {
	id: true,
	name: true,
	email: true,
};

const splitInclude = {
	tenant: { select: tenantSelect },
};

const billInclude = {
	room: { select: { id: true, name: true, flatId: true } },
	splits: { include: splitInclude },
};

const createBill = async (
	payload: ICreateBillPayload,
): Promise<IBillResponse> => {
	const room = await prisma.room.findUnique({
		where: { id: payload.roomId },
	});

	if (!room) {
		throw new AppError(httpStatus.NOT_FOUND, "Room not found");
	}

	const tenantIds = payload.splits.map((s) => s.tenantId);
	const tenants = await prisma.user.findMany({
		where: { id: { in: tenantIds } },
		select: { id: true },
	});

	if (tenants.length !== new Set(tenantIds).size) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"One or more split tenants do not exist (or are duplicated)",
		);
	}

	const bill = await prisma.utilityBill.create({
		data: {
			roomId: payload.roomId,
			type: payload.type,
			amount: payload.amount,
			currency: payload.currency ?? "BDT",
			billingPeriod: new Date(payload.billingPeriod),
			dueDate: new Date(payload.dueDate),
			billUrl: payload.billUrl,
			notes: payload.notes,
			splits: {
				create: payload.splits.map((s) => ({
					tenantId: s.tenantId,
					amount: s.amount,
				})),
			},
		},
		include: billInclude,
	});

	for (const split of payload.splits) {
		await prisma.notification.create({
			data: {
				userId: split.tenantId,
				type: "UTILITY_BILL_CREATED",
				title: `New ${payload.type.toLowerCase()} bill`,
				message: `A ${payload.type.toLowerCase()} bill of ${split.amount} ${payload.currency ?? "BDT"} is due on ${payload.dueDate}`,
				data: { utilityBillId: bill.id, roomId: payload.roomId },
			},
		});
	}

	return bill as unknown as IBillResponse;
};

const getBills = async (filters: IBillFilters): Promise<IBillListResponse> => {
	const {
		type,
		status,
		roomId,
		tenantId,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.UtilityBillWhereInput[] = [];

	if (type) andConditions.push({ type });
	if (status) andConditions.push({ status });
	if (roomId) andConditions.push({ roomId });
	if (tenantId) {
		andConditions.push({ splits: { some: { tenantId } } });
	}

	const where = andConditions.length > 0 ? { AND: andConditions } : undefined;

	const [bills, total] = await Promise.all([
		prisma.utilityBill.findMany({
			where,
			include: billInclude,
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.utilityBill.count({ where }),
	]);

	return {
		data: bills as unknown as IBillResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getBillById = async (id: string): Promise<IBillResponse> => {
	const bill = await prisma.utilityBill.findUnique({
		where: { id },
		include: billInclude,
	});

	if (!bill) {
		throw new AppError(httpStatus.NOT_FOUND, "Utility bill not found");
	}

	return bill as unknown as IBillResponse;
};

const getMyBills = async (
	tenantId: string,
	status?: IBillFilters["status"],
): Promise<IBillSplitResponse[]> => {
	const splits = await prisma.utilityBillSplit.findMany({
		where: {
			tenantId,
			...(status ? { utilityBill: { status } } : {}),
		},
		include: {
			tenant: { select: tenantSelect },
			utilityBill: {
				select: {
					id: true,
					roomId: true,
					type: true,
					amount: true,
					currency: true,
					billingPeriod: true,
					dueDate: true,
					status: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return splits as unknown as IBillSplitResponse[];
};

const updateBill = async (
	id: string,
	payload: IUpdateBillPayload,
): Promise<IBillResponse> => {
	const bill = await prisma.utilityBill.findUnique({ where: { id } });

	if (!bill) {
		throw new AppError(httpStatus.NOT_FOUND, "Utility bill not found");
	}

	if (bill.status === "PAID") {
		throw new AppError(httpStatus.BAD_REQUEST, "Paid bills cannot be updated");
	}

	const updated = await prisma.utilityBill.update({
		where: { id },
		data: {
			...payload,
			billingPeriod: payload.billingPeriod
				? new Date(payload.billingPeriod)
				: undefined,
			dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
		},
		include: billInclude,
	});

	return updated as unknown as IBillResponse;
};

const updateBillStatus = async (
	id: string,
	payload: IUpdateBillStatusPayload,
): Promise<IBillResponse> => {
	const bill = await prisma.utilityBill.findUnique({ where: { id } });

	if (!bill) {
		throw new AppError(httpStatus.NOT_FOUND, "Utility bill not found");
	}

	const updated = await prisma.utilityBill.update({
		where: { id },
		data: { status: payload.status },
		include: billInclude,
	});

	return updated as unknown as IBillResponse;
};

const paySplit = async (
	splitId: string,
	tenantId: string,
): Promise<IBillSplitResponse> => {
	const split = await prisma.utilityBillSplit.findUnique({
		where: { id: splitId },
		include: { utilityBill: true },
	});

	if (!split) {
		throw new AppError(httpStatus.NOT_FOUND, "Bill split not found");
	}

	if (split.tenantId !== tenantId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only pay your own bill splits",
		);
	}

	if (split.status === "PAID") {
		throw new AppError(httpStatus.BAD_REQUEST, "This split is already paid");
	}

	const updatedSplit = await prisma.utilityBillSplit.update({
		where: { id: splitId },
		data: { status: "PAID", paidDate: new Date() },
		include: { tenant: { select: tenantSelect } },
	});

	const unpaidCount = await prisma.utilityBillSplit.count({
		where: { utilityBillId: split.utilityBillId, NOT: { status: "PAID" } },
	});

	if (unpaidCount === 0) {
		await prisma.utilityBill.update({
			where: { id: split.utilityBillId },
			data: { status: "PAID" },
		});
	} else if (split.utilityBill.status === "PENDING") {
		await prisma.utilityBill.update({
			where: { id: split.utilityBillId },
			data: { status: "PARTIAL" },
		});
	}

	return updatedSplit as unknown as IBillSplitResponse;
};

const deleteBill = async (id: string): Promise<void> => {
	const bill = await prisma.utilityBill.findUnique({
		where: { id },
		include: { splits: true },
	});

	if (!bill) {
		throw new AppError(httpStatus.NOT_FOUND, "Utility bill not found");
	}

	if (bill.splits.some((s) => s.status === "PAID")) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Bills with paid splits cannot be deleted",
		);
	}

	await prisma.utilityBillSplit.deleteMany({ where: { utilityBillId: id } });
	await prisma.utilityBill.delete({ where: { id } });
};

export const UtilityService = {
	createBill,
	getBills,
	getBillById,
	getMyBills,
	updateBill,
	updateBillStatus,
	paySplit,
	deleteBill,
};
