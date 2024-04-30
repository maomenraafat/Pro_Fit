import { Router } from "express";
const traineeReviewRouter = Router();
import * as review from "./review.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

traineeReviewRouter.post('/trainers/:trainerId/reviews', verifyToken, allowedTo('trainee'), review.addReview);

traineeReviewRouter.get('/trainers/:trainerId/reviews',verifyToken, allowedTo('trainee'),review.getReviews);

traineeReviewRouter.get('/trainers/:trainerId/reviews/me', verifyToken, allowedTo('trainee'), review.getSpecificReview);

traineeReviewRouter.patch('/trainers/reviews/:reviewId', verifyToken, allowedTo('trainee'), review.updateReview);

traineeReviewRouter.delete('/trainers/reviews/:reviewId', verifyToken, allowedTo('trainee'), review.deleteReview);

export default traineeReviewRouter;