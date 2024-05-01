import { nutritionModel } from "../../../Database/models/nutrition.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";

const addNutritionPlan = catchAsyncError(async (req, res, next) => {
  const trainer = req.user.payload.id;
  const { planName, description, days, plantype, daymacros, planmacros } =
    req.body;

  const data = new nutritionModel({
    planName,
    trainer,
    description,
    days,
    plantype,
    daymacros,
    planmacros,
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

const getNutritionPlans = catchAsyncError(async (req, res, next) => {
  const data = await nutritionModel
    .find()
    .select("planName description days plantype daymacros planmacros");

  res.status(200).json({
    status: "success",
    data,
  });
});

const getSpecificNutritionPlan = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await nutritionModel
    .findById(id)
    .select("planName description days plantype daymacros planmacros");
  if (!data) {
    return next(new AppError("No nutrition plan found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data,
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
  getNutritionPlans,
  getSpecificNutritionPlan,
  deleteNutritionPlan,
};
