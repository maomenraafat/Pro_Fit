import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { foodModel } from "../../../Database/models/food.model.js";
import { determineFolderName } from "../../multer/multer.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { nutritionModel } from "../../../Database/models/nutrition.model.js";

async function handleFoodImageUpload(user, file) {
  const folderName = determineFolderName({ user }, "foodImage");
  const uploadResult = await uploadImageToCloudinary(file, folderName);
  if (uploadResult) {
    return {
      photoUrl: uploadResult.url,
    };
  } else {
    throw new Error("Failed to upload image");
  }
}
const addFood = catchAsyncError(async (req, res, next) => {
  const {
    foodname,
    baseMacro,
    servingUnit,
    category,
    foodAllergens,
    diseaseCompatibility,
    description,
    per,
    dietType,
    mealtype,
    religionrestriction,
  } = req.body;
  const macros = {
    calories: req.body["macros.calories"],
    proteins: req.body["macros.proteins"],
    fats: req.body["macros.fats"],
    carbs: req.body["macros.carbs"],
  };

  let foodImage = null;

  if (req.file) {
    const uploadResult = await handleFoodImageUpload(req.user, req.file);
    if (uploadResult) {
      foodImage = uploadResult.photoUrl;
    } else {
      return next(new Error("Failed to upload image"));
    }
  }

  let Trainer, admin;
  if (req.user.payload.role === "trainer") {
    Trainer = req.user.payload.id;
  } else {
    admin = req.user.payload.id;
  }

  const data = new foodModel({
    foodname,
    foodImage,
    macros,
    baseMacro,
    servingUnit,
    category,
    foodAllergens,
    diseaseCompatibility,
    description,
    per,
    dietType,
    mealtype,
    religionrestriction,
    Trainer,
    admin,
  });

  await data.save();

  res.status(200).json({
    success: true,
    message: "Food added successfully",
    data,
  });
});
const updateFood = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  let data = await foodModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) {
    return next(new Error("Food item not found"));
  }
  if (req.file) {
    const uploadResult = await handleFoodImageUpload(req.user, req.file);
    if (uploadResult) {
      data.foodImage = uploadResult.photoUrl;
    } else {
      return next(new Error("Failed to upload new image"));
    }
  }
  Object.assign(data, req.body);
  await data.save();
  res.status(200).json({
    success: true,
    message: "Food updated successfully",
    data,
  });
});
const getTrainerFood = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  let apiFeatures = new ApiFeatures(foodModel.find({ Trainer: id }), req.query)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();
  let query = apiFeatures.mongooseQuery;
  let data = await query;
  let totalCount = await foodModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  if (!data || data.length === 0) {
    return next(new AppError("No data found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    Page: apiFeatures.page,
    limit: apiFeatures.limit,
    data,
  });
});
const getProfitFoods = catchAsyncError(async (req, res, next) => {
  let apiFeatures = new ApiFeatures(
    foodModel.find({ Trainer: null }),
    req.query
  )
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  let query = apiFeatures.mongooseQuery;
  let data = await query;

  let totalCount = await foodModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  if (!data || data.length === 0) {
    return next(new AppError("No data found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    Page: apiFeatures.page,
    limit: apiFeatures.limit,
    data,
  });
});
const getAllFoods = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  let allquery = { $or: [{ Trainer: id }, { Trainer: null }] };
  let query = {};
  if ("allFoods" in req.query) {
    query.$or = [{ Trainer: id }, { Trainer: null }];
  } else if ("trainerFoods" in req.query) {
    query.Trainer = id;
  } else if ("profitFoods" in req.query) {
    query.Trainer = null;
  }
  const allData = await foodModel.find(allquery);
  let apiFeatures = new ApiFeatures(foodModel.find(query), req.query)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();
  let data = await apiFeatures.mongooseQuery;
  let totalCount = await foodModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);
  if (data.length === 0) {
    res.status(201).json({
      success: true,
      message: "Success",
      totalDocuments: totalCount,
      totalPages: totalPages,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      data: [],
      allData,
    });
  }
  res.status(200).json({
    success: true,
    message: "Success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    data,
    allData,
  });
});

const getFoodsForSpecificplan = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const nutritionId = req.params.id;
  const nutrition = await nutritionModel.findById(nutritionId);
  if (!nutrition) {
    return next(new AppError("Nutrition plan not found", 404));
  }

  let query = {};
  if ("allFoods" in req.query) {
    query.$or = [{ Trainer: id }, { Trainer: null }];
  } else if ("trainerFoods" in req.query) {
    query.Trainer = id;
  } else if ("profitFoods" in req.query) {
    query.Trainer = null;
  }

  let apiFeatures = new ApiFeatures(foodModel.find(query), req.query)
    //.search(["foodname", "category"])
    .filter()
    .sort()
    .paginate()
    .fields();
  let foods = await apiFeatures.mongooseQuery;
  let totalCount = await foodModel.countDocuments(
    apiFeatures.mongooseQuery.getQuery()
  );

  foods = foods.map((food) => {
    const augmentedFood = food.toObject();
    augmentedFood.allergenMatch = food.checkAllergensMatch(nutrition);
    augmentedFood.diseaseCompatibilityMatch =
      food.checkDiseaseCompatibilityMatch(nutrition);
    augmentedFood.religionRestrictionMatch =
      food.checkReligionRestrictionsMatch(nutrition);
    return augmentedFood;
  });

  if (foods.length === 0) {
    return next(new AppError("Data not found", 404));
  }

  const totalPages = Math.ceil(totalCount / apiFeatures.limit);
  res.status(200).json({
    success: true,
    message: "Success",
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    data: foods,
  });
});

const getSpecificFood = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await foodModel.findById(id);
  if (!data) {
    return next(new AppError(" data not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "success",
    data,
  });
});
const deleteFood = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await foodModel.findByIdAndDelete(id);
  if (!data) {
    return next(new AppError(" data not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Food deleted successfully",
    data,
  });
});

export {
  addFood,
  updateFood,
  getTrainerFood,
  getProfitFoods,
  getAllFoods,
  getFoodsForSpecificplan,
  getSpecificFood,
  deleteFood,
};
