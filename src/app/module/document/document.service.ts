import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateDocumentPayload,
	IDocumentFilters,
	IDocumentListResponse,
	IDocumentResponse,
	IUpdateDocumentPayload,
	IUpdateDocumentStatusPayload,
} from "./document.interface";
import { buildMeta } from "../../utils/query";

const applicationSelect = {
	id: true,
	status: true,
	tenantId: true,
	roomId: true,
};

const createDocument = async (
	payload: ICreateDocumentPayload,
): Promise<IDocumentResponse> => {
	const application = await prisma.application.findUnique({
		where: { id: payload.applicationId },
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found");
	}

	const document = await prisma.rentalDocument.create({
		data: {
			applicationId: payload.applicationId,
			type: payload.type,
			title: payload.title,
			fileUrl: payload.fileUrl,
			expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
			metadata: payload.metadata as unknown as Prisma.JsonObject | undefined,
		},
		include: { application: { select: applicationSelect } },
	});

	return document as unknown as IDocumentResponse;
};

const getDocuments = async (
	filters: IDocumentFilters,
): Promise<IDocumentListResponse> => {
	const {
		applicationId,
		type,
		status,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.RentalDocumentWhereInput[] = [];

	if (applicationId) andConditions.push({ applicationId });
	if (type) andConditions.push({ type });
	if (status) andConditions.push({ status });

	const where = andConditions.length > 0 ? { AND: andConditions } : undefined;

	const [documents, total] = await Promise.all([
		prisma.rentalDocument.findMany({
			where,
			include: { application: { select: applicationSelect } },
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.rentalDocument.count({ where }),
	]);

	return {
		data: documents as unknown as IDocumentResponse[],
		meta: buildMeta(page, limit, total),
	};
};

const getDocumentById = async (id: string): Promise<IDocumentResponse> => {
	const document = await prisma.rentalDocument.findUnique({
		where: { id },
		include: { application: { select: applicationSelect } },
	});

	if (!document) {
		throw new AppError(httpStatus.NOT_FOUND, "Document not found");
	}

	return document as unknown as IDocumentResponse;
};

const updateDocument = async (
	id: string,
	payload: IUpdateDocumentPayload,
): Promise<IDocumentResponse> => {
	const document = await prisma.rentalDocument.findUnique({
		where: { id },
	});

	if (!document) {
		throw new AppError(httpStatus.NOT_FOUND, "Document not found");
	}

	if (document.status === "SIGNED") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Signed documents cannot be edited",
		);
	}

	const updated = await prisma.rentalDocument.update({
		where: { id },
		data: {
			...payload,
			expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
			metadata: payload.metadata as unknown as Prisma.JsonObject | undefined,
		},
		include: { application: { select: applicationSelect } },
	});

	return updated as unknown as IDocumentResponse;
};

const updateDocumentStatus = async (
	id: string,
	payload: IUpdateDocumentStatusPayload,
): Promise<IDocumentResponse> => {
	const document = await prisma.rentalDocument.findUnique({
		where: { id },
		include: { application: true },
	});

	if (!document) {
		throw new AppError(httpStatus.NOT_FOUND, "Document not found");
	}

	if (document.status === "SIGNED") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Signed documents cannot change status",
		);
	}

	if (
		document.status === "DRAFT" &&
		payload.status !== "PENDING_SIGNATURE" &&
		payload.status !== "REVOKED"
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Draft documents can only be sent for signature or revoked",
		);
	}

	const updated = await prisma.rentalDocument.update({
		where: { id },
		data: {
			status: payload.status,
			signedAt: payload.status === "SIGNED" ? new Date() : document.signedAt,
		},
		include: { application: { select: applicationSelect } },
	});

	if (payload.status === "SIGNED" && document.application) {
		await prisma.notification.create({
			data: {
				userId: document.application.tenantId,
				type: "DOCUMENT_SIGNED",
				title: "Document signed",
				message: `Your document "${document.title}" has been signed`,
				data: { documentId: id, applicationId: document.applicationId },
			},
		});
	}

	return updated as unknown as IDocumentResponse;
};

const deleteDocument = async (id: string): Promise<void> => {
	const document = await prisma.rentalDocument.findUnique({
		where: { id },
	});

	if (!document) {
		throw new AppError(httpStatus.NOT_FOUND, "Document not found");
	}

	if (document.status === "SIGNED") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Signed documents cannot be deleted",
		);
	}

	await prisma.rentalDocument.delete({ where: { id } });
};

export const DocumentService = {
	createDocument,
	getDocuments,
	getDocumentById,
	updateDocument,
	updateDocumentStatus,
	deleteDocument,
};
