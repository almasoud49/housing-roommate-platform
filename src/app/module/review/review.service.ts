import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateReviewPayload,
	IReviewFilters,
	IReviewListResponse,
	IReviewResponse,
} from "./review.interface";
import type { Prisma } from "../../../generated/prisma/client";

const createReview = async (
	reviewerId: string,
	payload: ICreateReviewPayload,
): Promise<IReviewResponse> => {
	if (reviewerId === payload.revieweeId) {
		throw new AppError(httpStatus.BAD_REQUEST, "You cannot review yourself");
	}

	const reviewee = await prisma.user.findUnique({
		where: { id: payload.revieweeId },
	});

	if (!reviewee) {
		throw new AppError(httpStatus.NOT_FOUND, "Reviewee not found");
	}

	const existingReview = await prisma.review.findFirst({
		where: {
			reviewerId,
			revieweeId: payload.revieweeId,
		},
	});

	if (existingReview) {
		throw new AppError(
			httpStatus.CONFLICT,
			"You have already reviewed this user",
		);
	}

	const review = await prisma.review.create({
		data: {
			reviewerId,
			revieweeId: payload.revieweeId,
			rating: payload.rating,
			comment: payload.comment,
		},
		include: {
			reviewer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			reviewee: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return review as IReviewResponse;
};

const getReviews = async (
	filters: IReviewFilters,
): Promise<IReviewListResponse> => {
	const {
		revieweeId,
		search,
		rating,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = filters;

	const andConditions: Prisma.ReviewWhereInput[] = [];

	if (revieweeId) {
		andConditions.push({ revieweeId });
	}

	if (rating) {
		andConditions.push({ rating });
	}

	if (search) {
		andConditions.push({
			OR: [
				{ comment: { contains: search, mode: "insensitive" } },
				{ reviewer: { name: { contains: search, mode: "insensitive" } } },
				{ reviewer: { email: { contains: search, mode: "insensitive" } } },
				{ reviewee: { name: { contains: search, mode: "insensitive" } } },
				{ reviewee: { email: { contains: search, mode: "insensitive" } } },
			],
		});
	}

	const [reviews, total] = await Promise.all([
		prisma.review.findMany({
			where: {
				AND: andConditions.length > 0 ? andConditions : undefined,
			},
			include: {
				reviewer: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				reviewee: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.review.count({
			where: {
				AND: andConditions,
			},
		}),
	]);

	return {
		data: reviews as IReviewResponse[],
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getReviewById = async (id: string): Promise<IReviewResponse> => {
	const review = await prisma.review.findUnique({
		where: { id },
		include: {
			reviewer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			reviewee: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (!review) {
		throw new AppError(httpStatus.NOT_FOUND, "Review not found");
	}

	return review as IReviewResponse;
};

export const ReviewService = {
	createReview,
	getReviews,
	getReviewById,
};
