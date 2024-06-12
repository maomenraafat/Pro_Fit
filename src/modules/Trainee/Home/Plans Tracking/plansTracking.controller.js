import { nutritionModel } from "../../../../../Database/models/nutrition.model.js";
import { catchAsyncError } from "../../../../utils/catchAsyncError.js";
import { freeDietPlanSubscription } from "../../../../../Database/models/freeDietPlanSubscription.model.js";
import mongoose from "mongoose";
import { getNutritionPlanData } from "../../../../utils/factor.js";

const trackingPlans = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;

  if (!traineeId) {
    return res.status(400).json({ message: "Trainee ID is required" });
  }

  const nutritionData = await getNutritionPlanData(traineeId);

  res.status(200).json({
    success: true,
    message: "Successfully retrieved nutrition tracking data",
    data: {
      Diet: nutritionData,
      Workout: {
        totalExercises: 0,
        totalExercisesDone: 0,
        percentage: 0,
      },
    },
  });
});

export { trackingPlans };
