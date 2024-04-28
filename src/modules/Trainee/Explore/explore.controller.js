import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { PackageModel } from "../../../../Database/models/Package.model.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { favouriteModel } from "../../../../Database/models/favouriteSchema.model.js";

const getAllTrainers = catchAsyncError(async (req, res, next) => {
  const sortDirection = req.query.sort === "desc" ? -1 : 1; // Read sort direction from query parameter
  const specializationFilter = req.query.specialization; // Read specialization filter from query parameter

  let matchStage = {};
  if (specializationFilter) {
    matchStage = {
      "specializations.label": specializationFilter,
    };
  }

  const trainersWithLowestPackagePrice = await trainerModel.aggregate([
    { $match: matchStage },
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
      $sort: { lowestPrice: sortDirection },
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

  res.status(200).json({
    success: true,
    data: trainersWithLowestPackagePrice,
  });
});

const getTrainerDetails = catchAsyncError(async (req, res, next) => {
  const { trainerId } = req.params; // Assuming the ID is passed as a URL parameter

  // Check if the trainer exists and populate the qualificationsAndAchievements
  const trainer = await trainerModel.findById(trainerId).populate({
    path: "qualificationsAndAchievements",
    select: "photo -_id", // Fetching only the photo field, excluding MongoDB's _id
  });

  if (!trainer) {
    return next(new AppError("No trainer found with that ID", 404));
  }

  // Fetch client transformations related to this trainer
  const clientTransformations = await ClientTransformationModel.find({
    trainerId: trainer._id,
  }).select("title description beforeImage afterImage");

  // Calculating age from birthDate
  const birthDate = new Date(trainer.birthDate);
  const age = new Date().getFullYear() - birthDate.getFullYear();
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

  // Build response object with customized trainer details
  const trainerDetails = {
    _id: trainer._id,
    fullName: `${trainer.firstName} ${trainer.lastName}`, // Combine first name and last name
    location: `${trainer.city}, ${trainer.country}`, // Combine city and country
    age: `${age} Years Old`, // Provide age in "Years Old"
    specializations: trainer.specializations.map((spec) => spec.label), // Provide array of labels only
    email: trainer.email,
    gender: trainer.gender,
    subscribers: trainer.subscribers,
    qualificationsAndAchievements: trainer.qualificationsAndAchievements.map(
      (qa) => qa.photo
    ), // Array of photo URLs
    createdAt: monthYear, // Formatted creation date
    biography: trainer.biography,
    phoneNumber: trainer.phoneNumber,
    profilePhoto: trainer.profilePhoto,
    yearsOfExperience: trainer.yearsOfExperience,
    clientTransformations: clientTransformations.map((ct) => ({
      title: ct.title,
      description: ct.description,
      beforeImage: ct.beforeImage,
      afterImage: ct.afterImage,
    })), // Include client transformations
  };

  // Sending response
  res.status(200).json({
    success: true,
    data: trainerDetails,
  });
});

const addFavorite = catchAsyncError(async (req, res, next) => {
  const { trainerId } = req.params;
  const traineeId = req.user.payload.id;

  const existiingFavorite = await favouriteModel.findOne({
    trainee: traineeId,
    trainer: trainerId,
  });

  if (existiingFavorite) {
    return next(
      new AppError("This trainer is already in your favorites list", 400)
    );
  }

  // Add to favorites if not already there
  const favorite = await favouriteModel.create({
    trainee: traineeId,
    trainer: trainerId,
  });

  res.status(201).json({
    success: true,
    data: favorite,
  });
});

const removeFavorite = catchAsyncError(async (req, res, next) => {
  const { trainerId } = req.params;
  const traineeId = req.user.payload.id;

  const favorite = await favouriteModel.findOneAndDelete({
    trainee: traineeId,
    trainer: trainerId,
  });

  if (!favorite) {
    return next(new AppError("No favorite found with that ID", 404));
  }

  // If you want to return a 200 OK status instead of 204 No Content:
  res.status(200).json({
    success: true,
    message: "Favorite successfully removed.",
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

  // Now, use these IDs to get the trainers' details similar to getAllTrainers
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
        lowestPrice: { $arrayElemAt: ["$lowestPackage.price", 0] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: trainersDetails,
  });
});

export {
  getAllTrainers,
  getTrainerDetails,
  addFavorite,
  removeFavorite,
  getAllFavorites,
};
