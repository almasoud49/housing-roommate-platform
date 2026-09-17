import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { requireUserId } from "../../utils/request";
import { parseListParams } from "../../utils/query";
import { sendCreated, sendOk, sendPaginated } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
	const userId = requireUserId(req);

	const result = await ReviewService.createReview(userId, req.body);

	sendCreated(res, "Review created successfully", result);
});

const getReviews = catchAsync(async (req: Request, res: Response) => {
	const filters = {
		revieweeId: (req.query.revieweeId as string) || undefined,
		...parseListParams(req.query),
	};

	const result = await ReviewService.getReviews(filters);

	sendPaginated(
		res,
		"Reviews retrieved successfully",
		result.data,
		result.meta,
	);
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params as { id: string };

	const result = await ReviewService.getReviewById(id);

	sendOk(res, "Review retrieved successfully", result);
});

export const ReviewController = {
	createReview,
	getReviews,
	getReviewById,
};
