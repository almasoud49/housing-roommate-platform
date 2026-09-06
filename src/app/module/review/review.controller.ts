import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
import { AppError } from "../../utils/AppError";

const createReview = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await ReviewService.createReview(req.user.userId, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Review created successfully",
		data: result,
	});
});

const getReviews = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		revieweeId: (req.query.revieweeId as string) || undefined,
		page: req.query.page ? parseInt(req.query.page as string) : 1,
		limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
		sortBy: (req.query.sortBy as string) || "createdAt",
		sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
	};

	const result = await ReviewService.getReviews(filters);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Reviews retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await ReviewService.getReviewById(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Review retrieved successfully",
		data: result,
	});
});

export const ReviewController = {
	createReview,
	getReviews,
	getReviewById,
};
