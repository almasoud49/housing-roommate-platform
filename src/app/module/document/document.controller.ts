import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import type { IDocumentFilters } from "./document.interface";
import { DocumentService } from "./document.service";

const createDocument = catchAsync(async (req: Request, res: Response) => {
	const result = await DocumentService.createDocument(req.body);

	sendCreated(res, "Document created successfully", result);
});

const getDocuments = catchAsync(async (req: Request, res: Response) => {
	const filters: IDocumentFilters = {
		applicationId: (req.query.applicationId as string) || undefined,
		type: (req.query.type as IDocumentFilters["type"]) || undefined,
		status: (req.query.status as IDocumentFilters["status"]) || undefined,
		...parseListParams(req.query),
	};

	const result = await DocumentService.getDocuments(filters);

	sendPaginated(
		res,
		"Documents retrieved successfully",
		result.data,
		result.meta,
	);
});

const getDocumentById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await DocumentService.getDocumentById(id);

	sendOk(res, "Document retrieved successfully", result);
});

const updateDocument = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await DocumentService.updateDocument(id, req.body);

	sendOk(res, "Document updated successfully", result);
});

const updateDocumentStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await DocumentService.updateDocumentStatus(id, req.body);

	sendOk(res, "Document status updated successfully", result);
});

const deleteDocument = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	await DocumentService.deleteDocument(id);

	sendOk(res, "Document deleted successfully", null);
});

export const DocumentController = {
	createDocument,
	getDocuments,
	getDocumentById,
	updateDocument,
	updateDocumentStatus,
	deleteDocument,
};
