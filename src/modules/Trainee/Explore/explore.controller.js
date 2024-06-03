import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { favouriteModel } from "../../../../Database/models/favouriteSchema.model.js";
import mongoose from "mongoose";
import { favoriteDietPlanModel } from "../../../../Database/models/favoriteDietPlan.model.js";
import { nutritionModel } from "../../../../Database/models/nutrition.model.js";

const getAllTrainers = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const sortDirection = req.query.sort === "desc" ? -1 : 1;
  const specializationFilter = req.query.specialization;

  let matchStage = {};
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
    subscribers: trainer.subscribers,
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

  const responseData = freePlans.map(plan => ({
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
    isFavorite: !!plan.isFavorite.length,
  }));

  res.status(200).json({
    success: true,
    totalDocuments: freePlans.length,
    data: responseData,
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

const toggleFavorite = catchAsyncError(async (req, res) => {
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

  // Retrieve all favorite diet plans for the trainee
  const favoriteDietPlans = await favoriteDietPlanModel
    .find({ trainee: traineeId })
    .populate("dietPlan");

  // Check if there are no favorite diet plans and return an appropriate message
  if (favoriteDietPlans.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No favorite diet plans found.",
      data: [],
    });
  }

  // Send the response with the details of favorite diet plans
  res.status(200).json({
    success: true,
    data: favoriteDietPlans.map((fav) => ({
      ...fav.dietPlan.toObject(),
      isFavorite: true 
    })),
  });
});

export {
  getAllTrainers,
  getTrainerAbout,
  getClientTransformations,
  toggleFavorite,
  getAllFavorites,
  toggleFavoriteDietPlan,
  getAllFavoriteDietPlans,
  getNutritionFreePlansForTrainer
};
