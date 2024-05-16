import { reviewModel } from "../../../../Database/models/review.model.js";
import { SubscriptionModel } from "../../../../Database/models/subscription.model.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";

const addReview = catchAsyncError(async (req, res) => {
  const { trainerId } = req.params;
  const { rating, comment } = req.body;
  const traineeId = req.user.payload.id;

  // Check if the trainee has an active subscription with the trainer
  const activeSubscription = await SubscriptionModel.findOne({
    trainerId: trainerId,
    traineeId: traineeId,
    status: "Active",
  });
  console.log(activeSubscription);

  if (!activeSubscription) {
    return res.status(403).json({
      success: false,
      message: "You can only review trainers you have subscribed to.",
    });
  }

  // Check if the trainee has already reviewed this trainer
  const existingReview = await reviewModel.findOne({
    trainer: trainerId,
    trainee: traineeId,
  });

  // If a review already exists, return a response indicating so
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: "You have already reviewed this trainer.",
    });
  }

  // If no review exists, create a new one
  const review = await reviewModel.create({
    trainer: trainerId,
    trainee: traineeId,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
});

const getReviews = catchAsyncError(async (req, res) => {
  const { trainerId } = req.params;
  const traineeId = req.user.payload.id; 

  // Update the populate method to include the profilePhoto
  const reviews = await reviewModel
    .find({ trainer: trainerId })
    .populate("trainee", "firstName lastName profilePhoto");

  // If no reviews, provide a successful empty response
  if (reviews.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No reviews found for this trainer.",
      data: {
        reviews: [],
        averageRating: 0,
        ratingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
  }

  // Calculate the average rating and distribution
  const averageRating = (
    reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
  ).toFixed(1);
  let ratingsDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => ratingsDistribution[review.rating]++);

  // Normalize distribution to percentages
  Object.keys(ratingsDistribution).forEach((key) => {
    ratingsDistribution[key] = parseInt(
      ((ratingsDistribution[key] / reviews.length) * 100).toFixed(0)
    );
  });

  // Sort reviews to show the current trainee's review first if it exists
  const formattedReviews = reviews
    .map((review) => ({
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      traineeName: `${review.trainee.firstName} ${review.trainee.lastName}`,
      profilePhoto: review.trainee.profilePhoto, // Include the profile photo
      isCurrentUser: review.trainee._id.toString() === traineeId,
    }))
    .sort((a, b) => b.isCurrentUser - a.isCurrentUser); // This will ensure that current user's review comes first if present

  res.status(200).json({
    success: true,
    data: {
      averageRating: Number(averageRating),
      ratingsDistribution,
      reviews: formattedReviews,
    },
  });
});

const getSpecificReview = catchAsyncError(async (req, res) => {
  const { trainerId } = req.params;
  const traineeId = req.user.payload.id;

  const review = await reviewModel
    .findOne({
      trainer: trainerId,
      trainee: traineeId,
    })
    .populate("trainee", "firstName lastName");

  // If no review is found, return a message
  if (!review) {
    return res.status(404).json({
      success: false,
      message: "No review found for this trainer by the current trainee.",
    });
  }

  // Formatting the review to match the desired response structure
  const formattedReview = {
    rating: review.rating,
    comment: review.comment,
    date: review.createdAt.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    traineeName: review.trainee
      ? `${review.trainee.firstName} ${review.trainee.lastName}`
      : "Anonymous",
  };

  // Sending the formatted review in response
  res.status(200).json({
    success: true,
    data: formattedReview,
  });
});

const deleteReview = catchAsyncError(async (req, res) => {
  const { reviewId } = req.params;
  const traineeId = req.user.payload.id;

  // Check if the review exists and belongs to the trainee

  const isExist = await reviewModel.findOneAndDelete({
    _id: reviewId,
    trainee: traineeId,
  });

  //Check if review was not found
  if (!isExist) {
    return res.status(404).json({
      success: false,
      message:
        "Review not found or you do not have permission to delete this review.",
    });
  }

  res
    .status(204)
    .json({ success: true, message: "Review deleted successfully." });
});

const updateReview = catchAsyncError(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const traineeId = req.user.payload.id;

  // Check if the review exists and belongs to the trainee
  const review = await reviewModel.findOne({
    _id: reviewId,
    trainee: traineeId,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message:
        "Review not found or you do not have permission to update this review.",
    });
  }

  // Update the fields that are provided in the request body
  if (rating !== undefined) {
    review.rating = rating;
  }
  if (comment !== undefined) {
    review.comment = comment;
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: review,
  });
});

export { addReview, getReviews, getSpecificReview, deleteReview, updateReview };
