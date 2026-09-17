import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUser } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import type { IBillFilters } from "./utility.interface";
import { UtilityService } from "./utility.service";

const createBill = catchAsync(async (req: Request, res: Response) => {
	const result = await UtilityService.createBill(req.body);

	sendCreated(res, "Utility bill created successfully", result);
});

const getBills = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);
	const filters: IBillFilters = {
		type: (req.query.type as IBillFilters["type"]) || undefined,
		status: (req.query.status as IBillFilters["status"]) || undefined,
		roomId: (req.query.roomId as string) || undefined,
		tenantId:
			user.role === "TENANT"
				? user.userId
				: (req.query.tenantId as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await UtilityService.getBills(filters);

	sendPaginated(
		res,
		"Utility bills retrieved successfully",
		result.data,
		result.meta,
	);
});

const getBillById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await UtilityService.getBillById(id);

	sendOk(res, "Utility bill retrieved successfully", result);
});

const getMyBills = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const result = await UtilityService.getMyBills(
		user.userId,
		req.query.status as IBillFilters["status"],
	);

	sendOk(res, "My utility bills retrieved successfully", result);
});

const updateBill = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await UtilityService.updateBill(id, req.body);

	sendOk(res, "Utility bill updated successfully", result);
});

const updateBillStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await UtilityService.updateBillStatus(id, req.body);

	sendOk(res, "Utility bill status updated successfully", result);
});

const paySplit = catchAsync(async (req: Request, res: Response) => {
	const user = requireUser(req);

	const { splitId } = req.params as { splitId: string };

	const result = await UtilityService.paySplit(splitId, user.userId);

	sendOk(res, "Bill split paid successfully", result);
});

const deleteBill = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	await UtilityService.deleteBill(id);

	sendOk(res, "Utility bill deleted successfully", null);
});

export const UtilityController = {
	createBill,
	getBills,
	getBillById,
	getMyBills,
	updateBill,
	updateBillStatus,
	paySplit,
	deleteBill,
};
