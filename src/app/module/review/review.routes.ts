import { Router } from "express";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
	"/",
	auth(),
	validateRequest(ReviewValidation.createReviewSchema),
	ReviewController.createReview,
);
router.get(
	"/",
	auth(),
	validateRequest(ReviewValidation.reviewFiltersSchema),
	ReviewController.getReviews,
);
router.get("/:id", auth(), ReviewController.getReviewById);

export const ReviewRoutes = router;
