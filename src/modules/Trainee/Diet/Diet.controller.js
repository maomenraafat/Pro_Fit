import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { traineeDietAssessmentModel } from "../../../../Database/models/traineeDietAssessment.model.js";
import { traineeBasicInfoModel } from "../../../../Database/models/traineeBasicInfo.model.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
//import { toCairoTimeString, toCairoDate } from "../../../utils/dateUtils.js";
import { freeDietPlanSubscription } from "../../../../Database/models/freeDietPlanSubscription.model.js";

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
    data: firstDay,
  });
});

const subscribeToFreeDietPlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const planId = req.params.id;
  const dietPlan = await nutritionModel.findById(planId).populate("days");
  // console.log(dietPlan);
  if (!dietPlan) {
    return next(new AppError("Diet plan not found", 404));
  }

  const trainerId = dietPlan.trainer;
  const plandays = dietPlan.days;

  let existingSubscription = await freeDietPlanSubscription.findOne({
    trainee: traineeId,
  });

  if (existingSubscription) {
    existingSubscription.dietPlan = planId;
    existingSubscription.trainer = trainerId;
    existingSubscription.days = plandays;
    await existingSubscription.save();
  } else {
    existingSubscription = new freeDietPlanSubscription({
      trainee: traineeId,
      trainer: trainerId,
      dietPlan: planId,
      days: plandays,
    });
    await existingSubscription.save();
  }

  res.status(200).json({ success: true, data: existingSubscription });
});

const getSubscribedFreeDietPlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const subscribedPlans = await freeDietPlanSubscription.find({
    trainee: traineeId,
  });
  //.populate("dietPlan");

  res.status(200).json({ success: true, data: subscribedPlans });
});

const getCustomizeDietPlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  // const id = req.params.id;
  const data = await nutritionModel.findOne({
    trainee: traineeId,
    //trainer: id,
    status: "Current",
    plantype: "Customized plan",
  });
  if (!data) {
    // return next(new AppError("data not found", 404));
    res
      .status(200)
      .json({ success: true, message: "You Did not Have Customized plan" });
  }
  const macros = calculateConsumedMacros(data);
  res.status(200).json({ success: true, data, macros });
});

/*updateFoodConsumedStatus*/
const updateFoodConsumedStatus = catchAsyncError(async (req, res, next) => {
  const { planId, dayIndex, mealIndex, foods, markMeal } = req.body;

  const plan = await nutritionModel.findById(planId);

  if (!plan) {
    return next(new AppError("Nutrition plan not found", 404));
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

      console.log("Before update:", foodItem);

      foodItem.consumed = consumed;
      if (foodItem.macros) {
        updateEatenDaysMacros(plan.days[dayIndex], foodItem.macros, consumed);
      }

      console.log("After update:", foodItem);
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

  console.log("Plan after save:", plan);

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
  getSubscribedFreeDietPlan,
  getCustomizeDietPlan,
  updateFoodConsumedStatus,
};
