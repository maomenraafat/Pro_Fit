import { foodModel } from "../../../Database/models/food.model.js";
import { mealModel } from "../../../Database/models/meal.model.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";

async function calculateMealMacros(ingredients) {
  let mealMacros = {
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
  };

  for (const ingredient of ingredients) {
    const food = await foodModel.findById(ingredient.food).exec();

    if (!food || !food.macros) {
      throw new AppError("Food item not found or does not have macros", 404);
    }

    mealMacros.calories += (food.macros.calories || 0) * ingredient.amount;
    mealMacros.proteins += (food.macros.proteins || 0) * ingredient.amount;
    mealMacros.fats += (food.macros.fats || 0) * ingredient.amount;
    mealMacros.carbs += (food.macros.carbs || 0) * ingredient.amount;
  }

  return mealMacros;
}
// const addMeal = catchAsyncError(async (req, res, next) => {
//   const { mealname, ingredients, amount, mealnote, mealtype, mealmacros } =
//     req.body;
//   if (req.user.payload.role === "trainer") {
//     var Trainer = req.user.payload.id;
//   } else {
//     var admin = req.user.payload.id;
//   }
//   //const mealmacros = await calculateMealMacros(ingredients);
//   const data = new mealModel({
//     mealname,
//     mealnote,
//     mealtype,
//     ingredients,
//     amount,
//     mealmacros,
//     // baseMacro,
//     Trainer,
//     admin,
//   });

//   await data.save();

//   res.status(200).json({
//     message: "success",
//     data,
//   });
// });
const addMeal = catchAsyncError(async (req, res, next) => {
  const { mealname, ingredients, mealnote, mealtype, mealmacros } = req.body;
  const formattedIngredients = ingredients.map((ingredient) => ({
    food: ingredient.food,
    amount: ingredient.amount || 1,
    foodname: ingredient.foodname,
    foodImage: ingredient.foodImage,
    servingUnit: ingredient.servingUnit,
    macros: ingredient.macros,
  }));
  const mealData = {
    mealname,
    mealnote,
    mealtype,
    ingredients: formattedIngredients,
    mealmacros,
  };
  if (req.user.payload.role === "trainer") {
    mealData.Trainer = req.user.payload.id;
  } else {
    mealData.admin = req.user.payload.id;
  }

  const data = new mealModel(mealData);

  await data.save();

  res.status(200).json({
    message: "success",
    message: "Meal Added successfully",
    data,
  });
});
// const updateMeal = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const { mealname, ingredients, amount, mealnote, mealtype, mealmacros } =
//     req.body;

//   let data = await mealModel.findByIdAndUpdate(
//     id,
//     { mealname, ingredients, amount, mealnote, mealtype, mealmacros },
//     { new: true, runValidators: true }
//   );
//   if (!data) {
//     return next(new AppError("Meal not found", 404));
//   }
//   // if (ingredients) {
//   //   meal.mealmacros = await calculateMealMacros(ingredients);
//   // }
//   await data.save();
//   res.status(200).json({
//     message: "Meal updated successfully",
//     data,
//   });
// });
const updateMeal = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { mealname, ingredients, mealnote, mealtype, mealmacros } = req.body;
  const formattedIngredients = ingredients.map((ingredient) => ({
    food: ingredient.food,
    amount: ingredient.amount || 1,
    foodname: ingredient.foodname,
    foodImage: ingredient.foodImage,
    servingUnit: ingredient.servingUnit,
    macros: ingredient.macros,
  }));
  const updateData = {
    mealname,
    mealnote,
    mealtype,
    ingredients: formattedIngredients,
    mealmacros,
  };
  if (req.user.payload.role === "trainer") {
    updateData.Trainer = req.user.payload.id;
  } else {
    updateData.admin = req.user.payload.id;
  }
  let data = await mealModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!data) {
    return next(new AppError("Meal not found", 404));
  }
  res.status(200).json({
    message: "Meal updated successfully",
    data,
  });
});
const updateMealIngredients = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { ingredientsUpdate } = req.body;
  let meal = await mealModel.findById(id);
  if (!meal) {
    return next(new AppError("Meal not found", 404));
  }
  ingredientsUpdate.forEach((update) => {
    const ingredientIndex = meal.ingredients.findIndex(
      (ing) => ing.food.toString() === update.food
    );
    if (ingredientIndex !== -1) {
      if (update.newFood) {
        meal.ingredients[ingredientIndex].food = update.newFood;
      }
      if (update.amount !== undefined) {
        meal.ingredients[ingredientIndex].amount = update.amount;
      }
      // } else {
      //   // Add a new ingredient if it doesn't exist and newFood is specified
      //   if (update.newFood && update.amount !== undefined) {
      //     meal.ingredients.push({
      //       food: update.newFood, // Use newFood as the food ID for the new ingredient
      //       amount: update.amount,
      //     });
      //   } else if (update.food && update.amount !== undefined) {
      //     // Or treat the 'food' field as a new ingredient if 'newFood' isn't specified but 'food' is.
      //     meal.ingredients.push({
      //       food: update.food,
      //       amount: update.amount,
      //     });
      //   }
      // }
    }
  });
  meal.mealmacros = await calculateMealMacros(meal.ingredients);
  await meal.save();
  res.status(200).json({
    message: "Meal updated successfully",
    data: { meal },
  });
});
// const getTrainerMeals = catchAsyncError(async (req, res, next) => {
//   const id = req.user.payload.id; // Adjust based on your user authentication system
//   let apiFeatures = new ApiFeatures(mealModel.find({ Trainer: id }), req.query)
//     .paginate()
//     .fields()
//     .filter()
//     .sort()
//     .search();
//   apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.populate({
//     path: "ingredients.food",
//     select: "foodImage foodName macros",
//   });
//   let data = await apiFeatures.mongooseQuery;
//   let totalCount = await mealModel.countDocuments({ Trainer: id });
//   const totalPages = Math.ceil(totalCount / apiFeatures.limit);

//   if (!data) {
//     return next(new AppError("No data found for this trainer", 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: "Success",
//     totalDocuments: totalCount,
//     totalPages: totalPages,
//     Page: apiFeatures.page,
//     limit: apiFeatures.limit,
//     data,
//   });
// });
const getTrainerMeals = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  let apiFeatures = new ApiFeatures(mealModel.find({ Trainer: id }), req.query)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  let query = apiFeatures.mongooseQuery;
  // .populate({
  //   path: "ingredients.food",
  //   select: "",
  // });

  let data = await query;
  let totalCount = await mealModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  if (data.length === 0) {
    return next(new AppError("No data found for this trainer", 404));
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
// const getProfitMeals = catchAsyncError(async (req, res, next) => {
//   let apiFeatures = new ApiFeatures(
//     mealModel.find({ Trainer: null }),
//     req.query
//   )
//     .paginate()
//     .fields()
//     .filter()
//     .sort()
//     .search();
//   apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.populate({
//     path: "ingredients.food",
//     select: "foodImage foodName macros",
//   });
//   let data = await apiFeatures.mongooseQuery;
//   let totalCount = await mealModel.countDocuments({ Trainer: null });
//   const totalPages = Math.ceil(totalCount / apiFeatures.limit);

//   if (!data) {
//     return next(new AppError("No data found", 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: "Success",
//     totalDocuments: totalCount,
//     totalPages: totalPages,
//     Page: apiFeatures.page,
//     limit: apiFeatures.limit,
//     data,
//   });
// });
const getProfitMeals = catchAsyncError(async (req, res, next) => {
  let apiFeatures = new ApiFeatures(
    mealModel.find({ Trainer: null }),
    req.query
  )
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  let query = apiFeatures.mongooseQuery;
  // .populate({
  //   path: "ingredients.food",
  //   select: "",
  // });

  let data = await query;
  let totalCount = await mealModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  if (data.length === 0) {
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
// const getAllMeals = catchAsyncError(async (req, res, next) => {
//   let apiFeatures = new ApiFeatures(mealModel.find(), req.query)
//     .paginate()
//     .fields()
//     .filter()
//     .sort()
//     .search();

//   apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.populate({
//     path: "ingredients.food",
//     select: "",
//   });

//   let data = await apiFeatures.mongooseQuery;
//   let totalCount = await mealModel.countDocuments();
//   const totalPages = Math.ceil(totalCount / apiFeatures.limit);

//   if (data.length === 0) {
//     return next(new AppError("No data found", 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: "Success",
//     totalDocuments: totalCount,
//     totalPages: totalPages,
//     Page: apiFeatures.page,
//     limit: apiFeatures.limit,
//     data,
//   });
// });
const getAllMeals = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  //let query = { $or: [{ Trainer: id }, { Trainer: null }] };
  let query = {};
  if ("allMeals" in req.query) {
    query.$or = [{ Trainer: id }, { Trainer: null }];
  } else if ("trainerMeals" in req.query) {
    query.Trainer = id;
  } else if ("profitMeals" in req.query) {
    query.Trainer = null;
  }
  let apiFeatures = new ApiFeatures(mealModel.find(query), req.query)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();
  //let query = apiFeatures.mongooseQuery;
  // .populate({
  //   path: "ingredients.food",
  //   select: "",
  // });

  let data = await apiFeatures.mongooseQuery;

  let totalCount = await mealModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();

  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  if (data.length === 0) {
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
const getSpecificMeal = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await mealModel.findById(id).populate({
    path: "ingredients.food",
    select: "foodImage foodname macros",
  });
  if (!data) {
    return next(new AppError(" data not found", 404));
  }
  res.status(200).json({
    message: "success",
    data,
  });
});
const deleteMeal = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await mealModel.findByIdAndDelete(id);
  if (!data) {
    return next(new AppError(" data not found", 404));
  }
  res.status(200).json({
    message: "success",
    data,
  });
});

export {
  addMeal,
  updateMeal,
  getTrainerMeals,
  getProfitMeals,
  getAllMeals,
  getSpecificMeal,
  deleteMeal,
  updateMealIngredients,
};
