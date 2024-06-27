import { freeDietPlanSubscription } from "../../Database/models/freeDietPlanSubscription.model.js";
import { nutritionModel } from "../../Database/models/nutrition.model.js";
import { reviewModel } from "../../Database/models/review.model.js";

const deleteUser = async (userId, model) => {
  try {
    const result = await model.findByIdAndDelete(userId);
    if (!result) {
      return { success: false, status: 404, message: "User not found." };
    }
    return {
      success: true,
      status: 200,
      message: "User account deleted successfully.",
    };
  } catch (error) {
    return { success: false, status: 500, message: error.message };
  }
};
const getNutritionPlanData = async (traineeId) => {
  let nutritionPlan;
  let days = [];

  const subscriptionWithTrainer = await nutritionModel.findOne({
    trainee: traineeId,
    status: "Current",
    plantype: "Customized plan",
  });

  if (subscriptionWithTrainer) {
    nutritionPlan = subscriptionWithTrainer;
    days = nutritionPlan.days;
  } else {
    const freeDietSubscription = await freeDietPlanSubscription.findOne({
      trainee: traineeId,
    });

    if (freeDietSubscription && freeDietSubscription.days) {
      days = freeDietSubscription.days;
    }
  }

  if (days.length === 0) {
    return {
      totalDaysMacros: 0,
      totalEatenDaysMacros: 0,
      percentage: 0,
    };
  }

  let totalDayMacros = { calories: 0 /*proteins: 0, fats: 0, carbs: 0*/ };
  let totalEatenDaysMacros = {
    calories: 0 /*proteins: 0, fats: 0, carbs: 0*/,
  };

  days.forEach((day) => {
    totalDayMacros.calories += day.daymacros?.calories || 0;
    // totalDayMacros.proteins += day.daymacros?.proteins || 0;
    // totalDayMacros.fats += day.daymacros?.fats || 0;
    // totalDayMacros.carbs += day.daymacros?.carbs || 0;

    totalEatenDaysMacros.calories += day.eatenDaysMacros?.calories || 0;
    // totalEatenDaysMacros.proteins += day.eatenDaysMacros?.proteins || 0;
    // totalEatenDaysMacros.fats += day.eatenDaysMacros?.fats || 0;
    // totalEatenDaysMacros.carbs += day.eatenDaysMacros?.carbs || 0;
  });

  const percentageCalories = totalDayMacros.calories
    ? Math.round(
        (totalEatenDaysMacros.calories / totalDayMacros.calories) * 100
      )
    : 0;

  return {
    totalDaysMacros: totalDayMacros.calories,
    totalEatenDaysMacros: totalEatenDaysMacros.calories,
    percentage: percentageCalories,
  };
};
// const getNutritionPlanData = async (traineeId) => {
//   let nutritionPlan;
//   let days = [];

//   const subscriptionWithTrainer = await nutritionModel.findOne({
//     trainee: traineeId,
//     status: "Current",
//     plantype: "Customized plan",
//   });

//   if (subscriptionWithTrainer) {
//     nutritionPlan = subscriptionWithTrainer;
//     days = nutritionPlan.days;
//   } else {
//     const freeDietSubscription = await freeDietPlanSubscription.findOne({
//       trainee: traineeId,
//     });

//     if (freeDietSubscription && freeDietSubscription.days) {
//       days = freeDietSubscription.days;
//     }
//   }

//   if (days.length === 0) {
//     return {
//       success: true,
//       message: "No data found for this trainer.",
//       data: {
//         Diet: {
//           day: 0,
//           startDate: "",
//           totalDayMacros: 0,
//           totalEatenDayMacros: 0,
//         },
//         Workout: {
//           totalExercises: 0,
//           totalExercisesDone: 0,
//           percentage: 0,
//           // },
//         },
//       },
//     };
//   }
//   let totalDayMacros = { calories: 0 /*proteins: 0, fats: 0, carbs: 0*/ };
//   let totalEatenDaysMacros = {
//     calories: 0 /* proteins: 0, fats: 0, carbs: 0*/,
//   };

//   days.forEach((day) => {
//     totalDayMacros.calories += day.daymacros?.calories || 0;
//     // totalDayMacros.proteins += day.daymacros?.proteins || 0;
//     // totalDayMacros.fats += day.daymacros?.fats || 0;
//     // totalDayMacros.carbs += day.daymacros?.carbs || 0;

//     totalEatenDaysMacros.calories += day.eatenDaysMacros?.calories || 0;
//     // totalEatenDaysMacros.proteins += day.eatenDaysMacros?.proteins || 0;
//     // totalEatenDaysMacros.fats += day.eatenDaysMacros?.fats || 0;
//     // totalEatenDaysMacros.carbs += day.eatenDaysMacros?.carbs || 0;
//   });

//   const percentageCalories = totalDayMacros.calories
//     ? Math.round(
//         (totalEatenDaysMacros.calories / totalDayMacros.calories) * 100
//       )
//     : 0;

//   return {
//     totalDayMacros: totalDayMacros.calories,
//     totalEatenDaysMacros: totalEatenDaysMacros.calories,
//     percentage: percentageCalories,
//   };
// };

const getReviewsData = async (trainerId, traineeId) => {
  const reviews = await reviewModel
    .find({ trainer: trainerId })
    .populate({ path: "trainee", select: "firstName lastName profilePhoto" });

  if (reviews.length === 0) {
    return {
      success: true,
      message: "No reviews found for this trainer.",
      data: {
        reviews: [],
        averageRating: 0,
        ratingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    };
  }

  const averageRating = (
    reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
  ).toFixed(1);

  let ratingsDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => ratingsDistribution[review.rating]++);

  Object.keys(ratingsDistribution).forEach((key) => {
    ratingsDistribution[key] = parseInt(
      ((ratingsDistribution[key] / reviews.length) * 100).toFixed(0)
    );
  });

  const formattedReviews = reviews
    .map((review) => ({
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
      firstName: review.trainee.firstName,
      lastName: review.trainee.lastName,
      profilePhoto: review.trainee.profilePhoto,
      isCurrentUser: review.trainee._id.toString() === traineeId,
    }))
    .sort((a, b) => b.isCurrentUser - a.isCurrentUser);

  return {
    success: true,
    data: {
      averageRating: Number(averageRating),
      ratingsDistribution,
      reviews: formattedReviews,
    },
  };
};

export { deleteUser, getNutritionPlanData, getReviewsData };
