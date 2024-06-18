import { nutritionModel } from "../../../../../Database/models/nutrition.model.js";
import { catchAsyncError } from "../../../../utils/catchAsyncError.js";
import { freeDietPlanSubscription } from "../../../../../Database/models/freeDietPlanSubscription.model.js";
import mongoose from "mongoose";
import { getNutritionPlanData } from "../../../../utils/factor.js";

const trackingPlans = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const period = req.params.period || 999999999;

  if (!traineeId) {
    return res.status(400).json({ message: "Trainee ID is required" });
  }

  const dietPlans = await nutritionModel
    .find({
      trainee: traineeId,
      status: { $ne: "First" },
    })
    .select(
      "planName trainer trainee daysCount numberofmeals startDate days planmacros plantype published status originalPlan timestamps"
    );

  if (dietPlans.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No diet plans found for this trainee",
      data: [],
    });
  }

  let allDays = [];
  const currentDate = new Date();

  dietPlans.forEach((plan) => {
    const filteredDays = plan.days.filter((day) => {
      const dayDate = new Date(day.startDate);
      const timeDifference = currentDate - dayDate;
      const dayDifference = timeDifference / (1000 * 3600 * 24);
      return dayDifference <= period;
    });

    allDays = allDays.concat(filteredDays);
  });

  allDays.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  let previousDate = null;
  const resultDays = [];

  allDays.forEach((day, index) => {
    const dayDate = new Date(day.startDate);

    if (previousDate) {
      let nextExpectedDate = new Date(
        previousDate.getTime() + 24 * 60 * 60 * 1000
      );

      while (nextExpectedDate < dayDate) {
        resultDays.push({
          day: `Missing Day`,
          startDate: nextExpectedDate.toISOString(),
          totalDayMacros: 0,
          totalEatenDayMacros: 0,
        });
        nextExpectedDate = new Date(
          nextExpectedDate.getTime() + 24 * 60 * 60 * 1000
        );
      }
    }

    resultDays.push({
      day: day.day,
      startDate: day.startDate,
      totalDayMacros: day.daymacros?.calories || 0,
      totalEatenDayMacros: day.eatenDaysMacros?.calories || 0,
    });

    previousDate = dayDate;
  });

  res.status(200).json({
    success: true,
    message: "Successfully retrieved nutrition tracking data",
    data: resultDays,
  });
});

export { trackingPlans };
