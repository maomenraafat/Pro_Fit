import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { traineeDietAssessmentModel } from "../../../../Database/models/traineeDietAssessment.model.js";
import { traineeBasicInfoModel } from "../../../../Database/models/traineeBasicInfo.model.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
//import { toCairoTimeString, toCairoDate } from "../../../utils/dateUtils.js";
import { freeDietPlanSubscription } from "../../../../Database/models/freeDietPlanSubscription.model.js";
import { traineeModel } from "../../../../Database/models/Trainee.model.js";

function calculateConsumedMacros(plan) {
  let totalMacros = { calories: 0, proteins: 0, fats: 0, carbs: 0 };

  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        if (food.consumed) {
          totalMacros.calories += food.macros.calories;
          totalMacros.proteins += food.macros.proteins;
          totalMacros.fats += food.macros.fats;
          totalMacros.carbs += food.macros.carbs;
        }
      });
    });
  });

  return totalMacros;
}

const getFreeDietPlans = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;

  const traineeInfo = await traineeBasicInfoModel
    .findOne({ trainee: traineeId })
    .select("dailymacros");

  if (!traineeInfo) {
    return next(new AppError(`No trainee found with id ${traineeId}`, 404));
  }

  const traineeMacros = traineeInfo.dailymacros;
  console.log("Trainee Macros:", traineeMacros);

  const Freeplans = await nutritionModel
    .find({ plantype: "Free plan", published: true })
    .select(
      "planName description numberofmeals dietType planmacros daysCount  goal"
    )
    .populate({ path: "trainer", select: "firstName lastName profilePhoto" });

  if (!Freeplans.length) {
    return next(new AppError("No free plans found", 404));
  }

  // Sort free plans based on closeness to trainee's daily macros
  // Freeplans.sort((a, b) => {
  //   const diffA =
  //     Math.abs(a.planmacros.protein - traineeMacros.protein) +
  //     Math.abs(a.planmacros.carbs - traineeMacros.carbs) +
  //     Math.abs(a.planmacros.fat - traineeMacros.fat);
  //   const diffB =
  //     Math.abs(b.planmacros.protein - traineeMacros.protein) +
  //     Math.abs(b.planmacros.carbs - traineeMacros.carbs) +
  //     Math.abs(b.planmacros.fat - traineeMacros.fat);
  //   return diffA - diffB;
  // });

  console.log("Before Sorting:");
  Freeplans.forEach((plan) =>
    console.log(plan.planName + ": " + plan.planmacros.calories)
  );

  Freeplans.sort((a, b) => {
    const diffA = Math.abs(a.planmacros.calories - traineeMacros.calories);
    const diffB = Math.abs(b.planmacros.calories - traineeMacros.calories);
    return diffA - diffB;
  });

  console.log("After Sorting:");
  Freeplans.forEach((plan) =>
    console.log(plan.planName + ": " + plan.planmacros.calories)
  );

  res
    .status(200)
    .json({ success: true, dailyMacros: traineeMacros, Freeplans });
});

const dietPlanOverview = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;

  const subscribedPlan = await nutritionModel.findById(id);

  if (!subscribedPlan) {
    return next(new AppError("Nutrition plan not found", 404));
  }

  const firstDay = subscribedPlan.days[0];

  if (!firstDay) {
    return res.status(200).json({ success: true, data: {} });
  }

  res.status(200).json({
    success: true,
    data: subscribedPlan,
  });
});

const subscribeToFreeDietPlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const planId = req.params.id;
  const { startDate } = req.body;

  const dietPlan = await nutritionModel.findById(planId).populate("days");
  if (!dietPlan) {
    return next(new AppError("Diet plan not found", 404));
  }

  const trainerId = dietPlan.trainer;
  const plandays = dietPlan.days;
  const daysCount = dietPlan.daysCount;
  const planmacros = dietPlan.planmacros;

  await nutritionModel.updateMany(
    {
      trainee: traineeId,
      plantype: "Free plan",
      status: "Current",
    },
    {
      status: "Archived",
    }
  );

  const lastPlan = await nutritionModel
    .findOne({
      trainee: traineeId,
      status: "Current",
    })
    .sort({ startDate: -1 })
    .populate("days");

  let startDateObj = new Date(startDate);
  if (lastPlan && lastPlan.days.length > 0) {
    const lastDay = new Date(lastPlan.days[lastPlan.days.length - 1].startDate);

    if (startDateObj <= lastDay) {
      return res.status(400).json({
        success: false,
        message:
          "Start date must be after the last day of the current nutrition plan",
      });
    }
  }

  const updatedDays = plandays.map((day, index) => {
    return {
      ...day._doc,
      startDate: new Date(
        startDateObj.getTime() +
          index * 24 * 60 * 60 * 1000 +
          3 * 60 * 60 * 1000
      ),
    };
  });

  const newNutritionPlan = new nutritionModel({
    trainer: trainerId,
    daysCount: daysCount,
    days: updatedDays,
    planmacros: planmacros,
    trainee: traineeId,
    originalPlan: planId,
    plantype: "Free plan",
    startDate: startDateObj,
    status: "Current",
  });

  await newNutritionPlan.save();

  // Optionally update the trainee's current nutrition plan
  // await traineeModel.findByIdAndUpdate(traineeId, {
  //   nutritionPlan: newNutritionPlan._id,
  // });

  res.status(200).json({ success: true, data: newNutritionPlan });
});

const getDietPlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;

  const DietPlan = await nutritionModel
    .find({
      trainee: traineeId,
      status: { $ne: "First" },
      //status: "Current",
      //plantype: "Customized plan",
    })
    .select(
      "_id planName trainer trainee daysCount numberofmeals startDate days planmacros plantype published status originalPlan timestamps"
    );

  if (DietPlan.length > 0) {
    return res.status(200).json({ success: true, data: DietPlan });
  }
  return res.status(200).json({
    success: true,
    message: "No diet plans found for this trainee",
    data: DietPlan,
  });
});

const setStartDateForCustomizedPlan = catchAsyncError(
  async (req, res, next) => {
    const planId = req.params.id;
    const { startDate } = req.body;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is required",
      });
    }

    const startDateObj = new Date(startDate);

    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date provided",
      });
    }

    const currentNutritionPlan = await nutritionModel
      .findOne({
        trainee: req.user.payload.id,
        status: "Archived",
      })
      .sort({ createdAt: -1 });

    if (currentNutritionPlan) {
      const lastDay =
        currentNutritionPlan.days[currentNutritionPlan.days.length - 1]
          .startDate;
      if (startDateObj <= new Date(lastDay)) {
        return res.status(400).json({
          success: false,
          message:
            "Start date must be after the last day of the current nutrition plan",
        });
      }
    }

    const nutritionPlan = await nutritionModel.findById(planId);
    if (!nutritionPlan) {
      return res.status(404).json({
        success: false,
        message: "Nutrition plan not found",
      });
    }

    nutritionPlan.startDate = startDateObj;

    if (nutritionPlan.days && nutritionPlan.days.length > 0) {
      nutritionPlan.days.forEach((day, index) => {
        day.startDate = new Date(
          startDateObj.getTime() +
            index * 24 * 60 * 60 * 1000 +
            3 * 60 * 60 * 1000
        );
      });
    }

    await nutritionPlan.save();

    res.status(200).json({
      success: true,
      message: "Start date set successfully for the plan and all days",
      data: nutritionPlan,
    });
  }
);

/*updateFoodConsumedStatus*/
const updateFoodConsumedStatus = catchAsyncError(async (req, res, next) => {
  const planId = req.params.id;
  const { dayIndex, mealIndex, foods, markMeal } = req.body;

  let plan = await nutritionModel.findById(planId);

  if (!plan) {
    plan = await freeDietPlanSubscription.findById(planId);
    if (!plan) {
      return next(new AppError("Nutrition plan not found", 404));
    }
  }

  if (!isValidMealIndex(plan, dayIndex, mealIndex)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid meal indices provided" });
  }

  const meal = plan.days[dayIndex].meals[mealIndex];

  if (markMeal) {
    meal.foods.forEach((food) => {
      food.consumed = foods[0].consumed;
      if (food.macros) {
        updateEatenDaysMacros(
          plan.days[dayIndex],
          food.macros,
          foods[0].consumed
        );
      }
    });

    if (meal.mealMacros) {
      updateEatenDaysMacros(
        plan.days[dayIndex],
        meal.mealMacros,
        foods[0].consumed
      );
    }
  } else {
    foods.forEach(({ foodIndex, consumed }) => {
      if (!isValidIndices(plan, dayIndex, mealIndex, foodIndex)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid food indices provided" });
      }

      const foodItem = plan.days[dayIndex].meals[mealIndex].foods[foodIndex];

      if (foodItem.consumed !== consumed) {
        //console.log("Before update:", foodItem);

        foodItem.consumed = consumed;
        if (foodItem.macros) {
          updateEatenDaysMacros(plan.days[dayIndex], foodItem.macros, consumed);
        }

        //console.log("After update:", foodItem);
      }
    });

    if (areAllFoodsConsumed(plan.days[dayIndex].meals[mealIndex].foods)) {
      if (plan.days[dayIndex].meals[mealIndex].mealMacros) {
        updateEatenDaysMacros(
          plan.days[dayIndex],
          plan.days[dayIndex].meals[mealIndex].mealMacros,
          true
        );
      }
    } else {
      if (plan.days[dayIndex].meals[mealIndex].mealMacros) {
        updateEatenDaysMacros(
          plan.days[dayIndex],
          plan.days[dayIndex].meals[mealIndex].mealMacros,
          false
        );
      }
    }
  }

  await plan.save();

  //console.log("Plan after save:", plan);

  return res.status(200).json({
    success: true,
    message: "Food consumed status updated successfully",
    data: plan,
  });
});
const isValidIndices = (plan, dayIndex, mealIndex, foodIndex) => {
  return (
    plan.days.length > dayIndex &&
    plan.days[dayIndex].meals.length > mealIndex &&
    plan.days[dayIndex].meals[mealIndex].foods.length > foodIndex
  );
};
const isValidMealIndex = (plan, dayIndex, mealIndex) => {
  return (
    plan.days.length > dayIndex && plan.days[dayIndex].meals.length > mealIndex
  );
};
const updateEatenDaysMacros = (day, macros, add) => {
  if (!macros) return;
  if (add) {
    day.eatenDaysMacros.calories += macros.calories;
    day.eatenDaysMacros.proteins += macros.proteins;
    day.eatenDaysMacros.fats += macros.fats;
    day.eatenDaysMacros.carbs += macros.carbs;
  } else {
    day.eatenDaysMacros.calories -= macros.calories;
    day.eatenDaysMacros.proteins -= macros.proteins;
    day.eatenDaysMacros.fats -= macros.fats;
    day.eatenDaysMacros.carbs -= macros.carbs;
  }
};
const areAllFoodsConsumed = (foods) => {
  return foods.every((food) => food.consumed);
};
/*updateFoodConsumedStatus*/

export {
  getFreeDietPlans,
  dietPlanOverview,
  subscribeToFreeDietPlan,
  getDietPlan,
  setStartDateForCustomizedPlan,
  //getSubscribedFreeDietPlan,
  // getCustomizeDietPlan,
  updateFoodConsumedStatus,
};
