import { nutritionModel } from "../../../Database/models/nutrition.model.js";
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
    numberOfWeeks,
  } = req.body;

  const data = new nutritionModel({
    planName,
    trainer,
    description,
    days,
    plantype,
    daymacros,
    planmacros,
    daysCount,
    goal,
    dietType,
    numberOfWeeks,
  });

  await data.save();

  res.status(201).json({
    status: "success",
    message: "NutritionPlan added successfully",
    data,
  });
});

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

  if (data.length === 0) {
    return next(new AppError("No nutrition plans found", 404));
  }

  res.status(200).json({
    status: "success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    data,
  });
});
const getNutritionFreePlans = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  let Query = { trainer: trainerId, plantype: "Free plan" };

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

  if (data.length === 0) {
    return next(new AppError("No nutrition plans found", 404));
  }

  res.status(200).json({
    status: "success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    data,
  });
});

// const getSpecificNutritionPlan = catchAsyncError(async (req, res, next) => {
//   const id = req.params.id;
//   const data = await nutritionModel
//     .findById(id)
//     .select(
//       "planName description days plantype daymacros planmacros daysCount"
//     );
//   if (!data) {
//     return next(new AppError("No nutrition plan found with that ID", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data,
//   });
// });

const getSpecificNutritionPlan = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await nutritionModel
    .findById(id)
    .select(
      "planName description days plantype daymacros planmacros daysCount"
    );

  if (!data) {
    return next(new AppError("No nutrition plan found with that ID", 404));
  }

  // Extract only the first 7 days
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
