import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { favouriteModel } from "../../../../Database/models/favouriteSchema.model.js";
import mongoose from "mongoose";
import { favoriteDietPlanModel } from "../../../../Database/models/favoriteDietPlan.model.js";
import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { traineeModel } from "../../../../Database/models/Trainee.model.js";
import { traineeBasicInfoModel } from "../../../../Database/models/traineeBasicInfo.model.js";
import { calculateMacronutrients } from "../Auth/auth.controller.js";
const getAllTrainers = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const sortDirection = req.query.sort === "desc" ? -1 : 1;
  const specializationFilter = req.query.specialization;

  let matchStage = {
    status: "accepted"
  };

  if (specializationFilter) {
    matchStage["specializations.label"] = specializationFilter;
  }

  const trainers = await trainerModel.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "packages",
        let: { trainerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$trainerId", "$$trainerId"] },
              active: true,
            },
          }, // Filter by active packages
          { $sort: { price: 1 } },
          { $limit: 1 },
        ],
        as: "lowestPackage",
      },
    },
    {
      $lookup: {
        from: "favorites",
        let: { trainerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$trainer", "$$trainerId"] },
                  { $eq: ["$trainee", new mongoose.Types.ObjectId(traineeId)] },
                ],
              },
            },
          },
        ],
        as: "favoriteStatus",
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "trainer",
        as: "reviews",
      },
    },
    {
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
        lowestPrice: {
          $ifNull: [{ $arrayElemAt: ["$lowestPackage.price", 0] }, 0],
        }, // Default lowestPrice to 0 if no packages
        specializations: "$specializations.label",
        isFavorite: { $anyElementTrue: ["$favoriteStatus"] },
        averageRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
        yearsOfExperienceText: {
          $cond: {
            if: { $gt: ["$yearsOfExperience", 0] },
            then: { $concat: [{ $toString: "$yearsOfExperience" }, " Years"] },
            else: "0 Years",
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        specializations: 1,
        yearsOfExperienceText: 1,
        lowestPrice: 1,
        isFavorite: 1,
        averageRating: 1,
        subscribers: 1,
        profilePhoto: 1,
      },
    },
    { $sort: { lowestPrice: sortDirection } },
  ]);

  res.status(200).json({
    success: true,
    data: trainers,
  });
});

const getTrainerAbout = catchAsyncError(async (req, res, next) => {
  const { trainerId } = req.params;

  // Check if the trainer exists and populate the qualificationsAndAchievements
  const trainer = await trainerModel.findById(trainerId).populate({
    path: "qualificationsAndAchievements",
    select: "photo -_id",
  });

  if (!trainer) {
    return next(new AppError("No trainer found with that ID", 404));
  }

  // Calculating age from birthDate
  const birthDate = new Date(trainer.birthDate);
  let age = new Date().getFullYear() - birthDate.getFullYear();
  const m = new Date().getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
    age--;
  }

  // Formatting createdAt to Month, Year
  const createdAt = new Date(trainer.createdAt);
  const monthYear = createdAt.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Ensure years of experience is at least 0 and append "Years"
  const yearsOfExperienceText = `${Math.max(
    0,
    trainer.yearsOfExperience || 0
  )} Years`;

  // Build response object with customized trainer details
  const trainerDetails = {
    _id: trainer._id,
    fullName: `${trainer.firstName} ${trainer.lastName}`,
    location: `${trainer.city}, ${trainer.country}`,
    age: `${age} Years Old`,
    specializations: trainer.specializations.map((spec) => spec.label),
    email: trainer.email,
    gender: trainer.gender,
    subscribers: trainer.subscriptions,
    qualificationsAndAchievements: trainer.qualificationsAndAchievements.map(
      (qa) => qa.photo
    ),
    createdAt: monthYear,
    biography: trainer.biography,
    phoneNumber: trainer.phoneNumber,
    profilePhoto: trainer.profilePhoto,
    yearsOfExperience: yearsOfExperienceText,
  };

  res.status(200).json({
    success: true,
    data: trainerDetails,
  });
});

const getClientTransformations = catchAsyncError(async (req, res, next) => {
  const { trainerId } = req.params;

  // Fetch client transformations related to this trainer
  const transformations = await ClientTransformationModel.find({
    trainerId: trainerId,
  }).select("title description beforeImage afterImage -_id");

  // If no transformations are found, return a message
  if (!transformations.length) {
    return res.status(404).json({
      success: false,
      message: "No transformations found for this trainer.",
    });
  }

  // Sending the transformations in response
  res.status(200).json({
    success: true,
    data: transformations,
  });
});

const getNutritionFreePlansForTrainer = catchAsyncError(async (req, res, next) => {
  const { trainerId } = req.params;
  const traineeId = req.user.payload.id;

  // Fetch all free diet plans for the specified trainer
  const freePlans = await nutritionModel.find({ trainer: trainerId, plantype: "Free plan" })
    .populate({
      path: 'isFavorite',
      match: { trainee: traineeId },
      select: '_id'
    });

  // Check if there are no free plans found
  if (freePlans.length === 0) {
    return next(new AppError("No free diet plans found for this trainer", 404));
  }

  // Aggregate ratings and reviews
  const planIds = freePlans.map(plan => plan._id);
  const ratingsData = await nutritionModel.aggregate([
    { $match: { _id: { $in: planIds }, rating: { $ne: null } } },
    {
      $group: {
        _id: "$_id",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  // Create a lookup map for ratings data
  const ratingsMap = new Map();
  ratingsData.forEach(data => {
    ratingsMap.set(data._id.toString(), data);
  });

  // Map response data
  const responseData = freePlans.map(plan => {
    const ratingInfo = ratingsMap.get(plan._id.toString()) || { averageRating: 0, reviewCount: 0 };
    return {
      id: plan._id,
      planName: plan.planName,
      dietType: plan.dietType,
      description: plan.description,
      calories: plan.planmacros.calories,
      proteins: plan.planmacros.proteins,
      carbs: plan.planmacros.carbs,
      fats: plan.planmacros.fats,
      rating: ratingInfo.averageRating,
      reviewCount: ratingInfo.reviewCount,
      goal: plan.goal || "Weight Loss",
      duration: `${plan.daysCount} Days`,
      meals: plan.days.length,
      isFavorite: !!plan.isFavorite.length,
    };
  });

  res.status(200).json({
    success: true,
    totalDocuments: freePlans.length,
    data: responseData,
  });
});

const getAllNutritionFreePlans = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;

  // Get trainee's basic info for macronutrient calculation
  const trainee = await traineeBasicInfoModel.findOne({ trainee: traineeId }).populate("trainee");

  // Calculate macronutrients for the trainee
  const { macros: traineeMacros } = await calculateMacronutrients(trainee);

  // Get IDs of all favorite diet plans for this trainee
  const favorites = await favoriteDietPlanModel.find({ trainee: traineeId });
  const favoriteIds = new Set(favorites.map(fav => fav.dietPlan.toString()));

  // Get dietType, mealsCount, and calorieFilter from query parameters
  const { dietType, mealsCount, calorieFilter } = req.query;

  // Start building the aggregation pipeline with a basic match for free plans
  let pipeline = [
    { $match: { plantype: "Free plan" ,published: true} 
  }
  ];

  // Filter by dietType if provided
  if (dietType) {
    pipeline.push({ $match: { dietType: dietType } });
  }

  // Filter by calorie range if provided
  if (calorieFilter) {
    let calorieMatch = {};
    switch (calorieFilter) {
      case "smallerThan1000":
        calorieMatch = { "planmacros.calories": { $lt: 1000 } };
        break;
      case "between1000and2000":
        calorieMatch = { "planmacros.calories": { $gte: 1000, $lte: 2000 } };
        break;
      case "between2000and3000":
        calorieMatch = { "planmacros.calories": { $gte: 2000, $lte: 3000 } };
        break;
      case "between3000and4000":
        calorieMatch = { "planmacros.calories": { $gte: 3000, $lte: 4000 } };
        break;
      case "biggerThan4000":
        calorieMatch = { "planmacros.calories": { $gt: 4000 } };
        break;
      default:
        break;
    }
    pipeline.push({ $match: calorieMatch });
  }

  // Calculate meals count per day in the days array
  pipeline.push(
    { $addFields: { "days.mealsCount": { $size: "$days.meals" } } },
    { $unwind: "$days" }
  );

  // Filter by mealsCount if provided
  if (mealsCount) {
    pipeline.push({ $match: { "days.mealsCount": parseInt(mealsCount) } });
  }

  // Group the documents back after filtering by days
  pipeline.push(
    { $group: {
      _id: "$_id",
      root: { $mergeObjects: "$$ROOT" },
      days: { $push: "$days" }
    }},
    { $replaceRoot: { newRoot: { $mergeObjects: ["$root", { days: "$days" }] } } }
  );

  // Add trainer details
  pipeline.push(
    {
      $lookup: {
        from: "trainers",
        localField: "trainer",
        foreignField: "_id",
        as: "trainerDetails"
      }
    },
    { $unwind: "$trainerDetails" }
  );

  // Calculate the average rating and review count for each plan
  pipeline.push(
    {
      $lookup: {
        from: "nutritions",
        localField: "_id",
        foreignField: "originalPlan",
        as: "ratings",
        pipeline: [
          { $match: { rating: { $exists: true } } },
          { $group: {
            _id: "$originalPlan",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 }
          }}
        ]
      }
    },
    {
      $addFields: {
        averageRating: { $arrayElemAt: ["$ratings.averageRating", 0] },
        reviewCount: { $arrayElemAt: ["$ratings.reviewCount", 0] }
      }
    },
    { $addFields: { averageRating: { $ifNull: ["$averageRating", 0] }, reviewCount: { $ifNull: ["$reviewCount", 0] } } }
  );

  // Filter by nearest macros
  pipeline.push(
    {
      $addFields: {
        macroDifference: {
          $sqrt: {
            $sum: [
              { $pow: [{ $subtract: ["$planmacros.calories", traineeMacros.calories] }, 2] },
              { $pow: [{ $subtract: ["$planmacros.proteins", traineeMacros.proteins] }, 2] },
              { $pow: [{ $subtract: ["$planmacros.fats", traineeMacros.fats] }, 2] },
              { $pow: [{ $subtract: ["$planmacros.carbs", traineeMacros.carbs] }, 2] }
            ]
          }
        }
      }
    },
    { $sort: { macroDifference: 1 } } // Sort by closest macros
  );

  // Execute the aggregation pipeline
  const freePlans = await nutritionModel.aggregate(pipeline);

  // Check if any plans were found
  if (freePlans.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No free diet plans found"
    });
  }

  // Prepare the response data, including mealsCount from the first day
  const responseData = freePlans.map(plan => {
    const trainer = plan.trainerDetails;
    return {
      _id: plan._id,
      planName: plan.planName,
      dietType: plan.dietType,
      description: plan.description,
      calories: plan.planmacros.calories,
      proteins: plan.planmacros.proteins,
      carbs: plan.planmacros.carbs,
      fats: plan.planmacros.fats,
      rating: plan.averageRating,
      reviewCount: plan.reviewCount,
      isFavorite: favoriteIds.has(plan._id.toString()),
      name: trainer ? `${trainer.firstName} ${trainer.lastName}` : null,
      profilePhoto: trainer ? trainer.profilePhoto : null
    };
  });

  // Send successful response
  res.status(200).json({
    success: true,
    totalDocuments: freePlans.length,
    data: responseData
  });
});

const getAllFavorites = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;

  // First, get all favorite trainer IDs for this trainee
  const favoriteTrainerIds = await favouriteModel
    .find({ trainee: traineeId })
    .select("trainer -_id");

  // Extract just the trainer IDs from the favorites
  const trainerIds = favoriteTrainerIds.map((favorite) => favorite.trainer);

  // Check if there are no favorites and return an appropriate message
  if (trainerIds.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No favorite trainers found.",
      data: [],
    });
  }

  // If there are favorite trainers, retrieve their details
  const trainersDetails = await trainerModel.aggregate([
    { $match: { _id: { $in: trainerIds } } },
    {
      $lookup: {
        from: "packages",
        let: { trainerId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$trainerId", "$$trainerId"] } } },
          { $sort: { price: 1 } },
          { $limit: 1 },
        ],
        as: "lowestPackage",
      },
    },
    {
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
        lowestPrice: { $arrayElemAt: ["$lowestPackage.price", 0] },
      },
    },
    {
      $project: {
        fullName: 1,
        profilePhoto: 1, // Add profile photo to the project stage
        specializations: {
          $map: {
            input: "$specializations",
            as: "spec",
            in: "$$spec.label",
          },
        },
        yearsOfExperience: 1,
        lowestPrice: 1,
      },
    },
  ]);

  // Send the response with the details of favorite trainers
  res.status(200).json({
    success: true,
    data: trainersDetails,
  });
});

const trainertoggleFavorite = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const { trainerId } = req.params;

  // Attempt to find an existing favorite
  const isExist = await favouriteModel.findOne({
    trainee: traineeId,
    trainer: trainerId,
  });
  // If it exists, remove it
  if (isExist) {
    await favouriteModel.findByIdAndDelete(isExist._id);
    return res.status(200).json({
      success: true,
      message: "Favorite removed successfully.",
      isFavorite: false,
    });
  }
  // If it does not exist, add it
  await favouriteModel.create({
    trainee: traineeId,
    trainer: trainerId,
  });

  return res.status(201).json({
    success: true,
    message: "Favorite added successfully.",
    isFavorite: true,
  });
});

const toggleFavoriteDietPlan = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const { dietPlanId } = req.params;

  console.log(dietPlanId);

  // Attempt to find an existing favorite diet plan
  const isExist = await favoriteDietPlanModel.findOne({
    trainee: traineeId,
    dietPlan: dietPlanId,
  });

  // If it exists, remove it
  if (isExist) {
    await favoriteDietPlanModel.findByIdAndDelete(isExist._id);
    return res.status(200).json({
      success: true,
      message: "Favorite diet plan removed successfully.",
      isFavorite: false,
    });
  }

  // If it does not exist, add it
  await favoriteDietPlanModel.create({
    trainee: traineeId,
    dietPlan: dietPlanId,
  });

  return res.status(201).json({
    success: true,
    message: "Favorite diet plan added successfully.",
    isFavorite: true,
  });
});

const getAllFavoriteDietPlans = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;

  // Retrieve all favorite diet plans for the trainee and populate necessary fields
  const favoriteDietPlans = await favoriteDietPlanModel
    .find({ trainee: traineeId })
    .populate({
      path: "dietPlan",
      populate: {
        path: "trainer", 
        select: "profilePhoto firstName lastName"
      }
    });

  // Check if there are no favorite diet plans and return an appropriate message
  if (favoriteDietPlans.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No favorite diet plans found.",
      data: [],
    });
  }

  // Map the favorite diet plans to the desired response format
  const responseData = favoriteDietPlans.map(fav => {
    const plan = fav.dietPlan;
    const trainer = plan.trainer;
    return {
      _id:plan._id,
      planName: plan.planName,
      dietType: plan.dietType,
      description: plan.description,
      calories: plan.planmacros.calories,
      proteins: plan.planmacros.proteins,
      carbs: plan.planmacros.carbs,
      fats: plan.planmacros.fats,
      rating: 4.3, 
      reviewCount: 119, 
      goal: plan.goal || "Weight Loss",
      duration: `${plan.daysCount} Days`,
      meals: plan.days.length,
      isFavorite: true, 
      profilePhoto: trainer.profilePhoto,
      name: `${trainer.firstName} ${trainer.lastName}`
    };
  });

  // Send the response with the formatted favorite diet plans
  res.status(200).json({
    success: true,
    totalDocuments: favoriteDietPlans.length,
    data: responseData,
  });
});

const getDailyNeeds = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id; 

  // Fetch the trainee's basic information which includes daily macronutrient needs
  const traineeData = await traineeModel.findById(traineeId)
    .populate({
      path: "traineeBasicInfo",
      select: "dailymacros -_id" 
    });

    console.log(traineeData);
  if (!traineeData || !traineeData.traineeBasicInfo) {
    return res.status(404).json({
      success: false,
      message: "Trainee daily needs not found."
    });
  }

  // Respond with the retrieved daily needs
  res.status(200).json({
    success: true,
    data: traineeData.traineeBasicInfo.dailymacros
  });
});

const getDietTypes = catchAsyncError(async (req, res, next) => {

    const dietTypes = [
      "Vegetarian",
      "Vegan",
      "Ketogenic",
      "Paleo",
      "Mediterranean",
      "Standard"
    ];

    if (!dietTypes || dietTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet types not found."
      });
    }

    // Respond with the list of diet types
    res.status(200).json({
      success: true,
      data: dietTypes
    });
});

const getMealsCounts = catchAsyncError(async (req, res, next) => {
  // Define the list of meals counts
  const mealsCounts = [1, 2, 3, 4, 5, 6, 7];

  // Check if the list is not empty
  if (!mealsCounts || mealsCounts.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Meals counts not found."
    });
  }

  // Respond with the list of meals counts
  res.status(200).json({
    success: true,
    data: mealsCounts
  });
});
const caloriesFilter = catchAsyncError((req, res) => {
  const calorieFilters = [
    { label: "< 1000", value: "smallerThan1000" },
    { label: "1000 - 2000", value: "between1000and2000" },
    { label: "2000 - 3000", value: "between2000and3000" },
    { label: "3000 - 4000", value: "between3000and4000" },
    { label: "> 4000", value: "biggerThan4000" }
  ];

  res.status(200).json({
    success: true,
    data: calorieFilters
  });
});
// const getAllFavoriteDietPlans = catchAsyncError(async (req, res, next) => {
//   const traineeId = req.user.payload.id;

//   // Retrieve all favorite diet plans for the trainee
//   const favoriteDietPlans = await favoriteDietPlanModel
//     .find({ trainee: traineeId })
//     .populate("dietPlan");

//   // Check if there are no favorite diet plans and return an appropriate message
//   if (favoriteDietPlans.length === 0) {
//     return res.status(200).json({
//       success: true,
//       message: "No favorite diet plans found.",
//       data: [],
//     });
//   }
//   console.log(favoriteDietPlans);

//   // Send the response with the details of favorite diet plans
//   res.status(200).json({
//     success: true,
//     data: favoriteDietPlans.map((fav) => ({
//       ...fav.dietPlan.toObject(),
//       isFavorite: true 
//     })),
//   });
// });
export {
  getAllTrainers,
  getTrainerAbout,
  getClientTransformations,
  trainertoggleFavorite,
  getAllFavorites,
  toggleFavoriteDietPlan,
  getAllFavoriteDietPlans,
  getNutritionFreePlansForTrainer,
  getAllNutritionFreePlans,
  getDailyNeeds,
  getDietTypes,
  getMealsCounts,
  caloriesFilter
};
