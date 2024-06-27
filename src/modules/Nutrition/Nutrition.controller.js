import {
  calculateFreePlanSubscribers,
  nutritionModel,
} from "../../../Database/models/nutrition.model.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";

const addNutritionPlan = catchAsyncError(async (req, res, next) => {
  const trainer = req.user.payload.id;
  const {
    planName,
    description,
    days,
    plantype,
    daymacros,
    planmacros,
    daysCount,
    goal,
    dietType,
    published,
    numberOfWeeks,
  } = req.body;

  // let newDays = [...days];

  // if (numberOfWeeks && numberOfWeeks > 1) {
  //   const daysToDuplicate = days.slice(0, 7);

  //   for (let i = 1; i < numberOfWeeks; i++) {
  //     daysToDuplicate.forEach((day, index) => {
  //       const newDay = { ...day };
  //       newDay._id = undefined;
  //       newDay.day = `Day ${newDays.length + 1}`;
  //       newDays.push(newDay);
  //     });
  //   }
  // }

  const data = new nutritionModel({
    planName,
    trainer,
    description,
    days /*: newDays*/,
    plantype,
    daymacros,
    planmacros,
    daysCount /*: newDays.length,*/,
    goal,
    dietType,
    published,
    numberOfWeeks,
  });

  await data.save();

  res.status(201).json({
    status: "success",
    message: "NutritionPlan added successfully",
    data,
  });
});

// const updateNutritionPlan = catchAsyncError(async (req, res, next) => {
//   const id = req.params.id;
//   const {
//     planName,
//     description,
//     days,
//     plantype,
//     daymacros,
//     planmacros,
//     daysCount,
//     goal,
//     dietType,
//     numberOfWeeks,
//     published,
//   } = req.body;

//   const nutritionPlan = await nutritionModel.findById(id);

//   if (!nutritionPlan) {
//     return next(new AppError("No nutrition plan found with that ID", 404));
//   }

//   let updatedDays = [...nutritionPlan.days];

//   days.forEach((updatedDay, index) => {
//     updatedDays[index] = updatedDay;
//     updatedDay._id = undefined;
//     updatedDays[index + 7] = { ...updatedDay, day: `Day ${index + 8}` };
//   });

//   nutritionPlan.planName = planName;
//   nutritionPlan.description = description;
//   nutritionPlan.days = updatedDays;
//   nutritionPlan.plantype = plantype;
//   nutritionPlan.daymacros = daymacros;
//   nutritionPlan.planmacros = planmacros;
//   nutritionPlan.daysCount = updatedDays.length;
//   nutritionPlan.goal = goal;
//   nutritionPlan.dietType = dietType;
//   nutritionPlan.numberOfWeeks = numberOfWeeks;
//   nutritionPlan.published = published;

//   await nutritionPlan.save();

//   res.status(200).json({
//     status: "success",
//     message: "NutritionPlan updated successfully",
//     data: nutritionPlan,
//   });
// });
const updateNutritionPlan = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;

  const data = await nutritionModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!data) {
    return next(new AppError("No nutrition plan found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    message: "Nutrition Plan updated successfully ",
    data,
  });
});
const getNutritionMyPlans = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  let Query = { trainer: trainerId, plantype: "My plan" };
  const allData = await nutritionModel.find(Query);
  let apiFeatures = new ApiFeatures(nutritionModel.find(Query), req.query)
    .search()
    .sort()
    .filter()
    .paginate()
    .fields();

  const data = await apiFeatures.mongooseQuery;

  const totalCount = await nutritionModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();

  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  // if (data.length === 0) {
  //   return next(new AppError("No nutrition plans found", 404));
  // }

  res.status(200).json({
    status: "success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    data: data.length > 0 ? data : [],
    allData,
  });
});

const getNutritionFreePlans = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  let Query = {
    trainer: trainerId,
    plantype: "Free plan",
    // originalPlan: { $ne: true },
    trainee: { $exists: false },
  };
  const allData = await nutritionModel.find(Query);
  let apiFeatures = new ApiFeatures(nutritionModel.find(Query), req.query)
    .search()
    .sort()
    .filter()
    .paginate()
    .fields();

  const data = await apiFeatures.mongooseQuery;

  const totalCount = await nutritionModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);
  //   const subscriberCounts = await Promise.all(
  //     data.map(async (plan) => {
  //       const subscriberCount = await calculateFreePlanSubscribers(plan._id);
  //       return {
  //         planId: plan._id,
  //         subscriberCount,
  //       };
  //     })
  //   );
  //   if (data.length === 0) {
  //     return next(new AppError("No nutrition plans found", 404));
  //   }

  //   res.status(200).json({
  //     status: "success",
  //     totalDocuments: totalCount,
  //     totalPages: totalPages,
  //     page: apiFeatures.page,
  //     limit: apiFeatures.limit,
  //     data,
  //     subscribers: subscriberCounts,
  //     //allData,
  //   });
  // });

  const plansWithSubscribers = await Promise.all(
    data.map(async (plan) => {
      const subscriberCount = await calculateFreePlanSubscribers(plan._id);
      return {
        ...plan.toObject(),
        subscribers: subscriberCount,
      };
    })
  );

  if (plansWithSubscribers.length === 0) {
    return next(new AppError("No nutrition plans found", 404));
  }

  res.status(200).json({
    status: "success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    data: plansWithSubscribers,
    allData,
  });
});

const getSpecificNutritionPlan = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await nutritionModel
    .findById(id)
    .select(
      "planName dietType description days plantype daymacros planmacros daysCount  numberOfWeeks published"
    );

  if (!data) {
    return next(new AppError("No nutrition plan found with that ID", 404));
  }
  const first7Days = data.days.slice(0, 7);
  res.status(200).json({
    status: "success",
    data: {
      ...data.toObject(),
      days: first7Days,
    },
  });
});

const deleteNutritionPlan = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;

  const data = await nutritionModel.findByIdAndDelete(id);

  if (!data) {
    return next(new AppError("No nutrition plan found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Nutrition Plan deleted successfully",
    data,
  });
});

export {
  addNutritionPlan,
  updateNutritionPlan,
  getNutritionMyPlans,
  getNutritionFreePlans,
  getSpecificNutritionPlan,
  deleteNutritionPlan,
};
