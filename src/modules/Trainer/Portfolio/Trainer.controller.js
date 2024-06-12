import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { AppError } from "../../../utils/AppError.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";
import { determineFolderName } from "../../../multer/multer.js";
import fs from "fs";
import { SubscriptionModel } from "../../../../Database/models/subscription.model.js";
import { ApiFeatures } from "../../../utils/ApiFeatures.js";
import { reviewModel } from "../../../../Database/models/review.model.js";
import { traineeModel } from "../../../../Database/models/Trainee.model.js";
import { getReviewsData } from "../../../utils/factor.js";

async function validateAndUpdateTrainer(id, statusUpdate, acceptPolicy) {
  const data = await trainerModel.findById(id);
  if (!data) {
    throw new Error("Data not found");
  }
  if (!acceptPolicy) {
    return {
      success: false,
      message: "You must accept the policy to proceed.",
    };
  }
  Object.assign(data, statusUpdate);
  const isCompleteProfile =
    data.country &&
    data.state &&
    data.city &&
    data.phoneNumber &&
    data.birthDate &&
    data.gender &&
    data.profilePhoto &&
    Array.isArray(data.specializations) &&
    data.specializations.length > 0 &&
    data.yearsOfExperience;
  if (isCompleteProfile && acceptPolicy) {
    data.status = "pending";
    data.acceptPolicy = acceptPolicy;
    await data.save({ validateBeforeSave: true });
    return { success: true, data };
  } else {
    return {
      success: false,
      message: "Please complete your profile and accept the policy.",
    };
  }
}

async function handleImageUpload(trainer, file) {
  const simulatedReq = {
    user: {
      payload: trainer,
    },
  };
  const folderName = determineFolderName(simulatedReq, "profilePhoto");
  const existingImageHash = trainer.profilePhotoHash;

  const uploadResult = await uploadImageToCloudinary(
    file,
    folderName,
    existingImageHash
  );
  if (uploadResult) {
    return {
      profilePhoto: uploadResult.url,
      profilePhotoHash: uploadResult.hash,
    };
  }

  return null;
}

const updatePersonalInfo = async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const { country, state, city, phoneNumber, birthDate, biography, gender } =
    req.body;
  let updateData = {
    country,
    state,
    city,
    phoneNumber,
    birthDate,
    biography,
    gender,
  };
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) {
    return next(new Error("Trainer not found"));
  }
  if (req.files["profilePhoto"] && req.files["profilePhoto"][0]) {
    const file = req.files["profilePhoto"][0];
    const imageUploadResult = await handleImageUpload(trainer, file);
    if (imageUploadResult) {
      updateData = { ...updateData, ...imageUploadResult };
    }
  }
  const newTrainer = await trainerModel.findByIdAndUpdate(
    trainerId,
    updateData,
    { new: true, runValidators: true }
  );
  if (!newTrainer) {
    return next(new Error("Data not found"));
  }
  res.status(201).json({
    success: true,
    message: "Data updated successfully",
    trainer: newTrainer,
  });
};

const getTrainerInfo = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const trainer = await trainerModel
    .findById(trainerId)
    .select(
      "country state city phoneNumber birthDate biography gender profilePhoto"
    );
  if (!trainer) {
    return next(new AppError("No trainer found with that ID", 404));
  }
  res.status(200).json({
    success: true,
    trainer,
  });
});

const updateProfessionalCredentials = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    const { specializations, yearsOfExperience, socialMedia } = req.body;
    // const trainer = await trainerModel.findById(trainerId);
    const updatedData = {
      specializations,
      yearsOfExperience,
      socialMedia,
    };

    const newTrainer = await trainerModel.findByIdAndUpdate(
      trainerId,
      updatedData,
      { new: true, runValidators: true }
    );
    if (!newTrainer) {
      return next(new AppError("data not found", 404));
    }
    res.status(201).json({
      success: true,
      message: "Data updated successfully",
      trainer: newTrainer,
    });
  }
);

const getProfessionalCredentials = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const trainer = await trainerModel
    .findById(trainerId)
    .select("specializations yearsOfExperience  socialMedia");

  if (!trainer) {
    return next(new AppError("No trainer found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    trainer,
  });
});

const submitionrequests = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const { status, acceptPolicy } = req.body;
  if (!acceptPolicy) {
    return res.status(400).json({
      success: false,
      message: "You must accept the policy to proceed.",
    });
  }
  const result = await validateAndUpdateTrainer(id, { status }, acceptPolicy);
  if (result.success) {
    res.status(201).json({
      success: true,
      message: "Profile has been submitted successfully",
      data: result.data,
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message,
    });
  }
});
// const getTrainerData = catchAsyncError(async (req, res, next) => {
//   const id = req.user.payload.id;
//   const trainer = await trainerModel
//     .findById(id)
//     .populate("qualificationsAndAchievements");
//   if (!trainer) {
//     return next(new AppError("Trainer data not found", 404));
//   }
//   const activeSubscribersCount = await SubscriptionModel.countDocuments({
//     trainerId: trainer._id,
//     status: "Active",
//   });
//   const trainerData = trainer.toObject();
//   trainerData.activeSubscribers = activeSubscribersCount;
//   console.log("Active subscribers:", trainerData.activeSubscribers);

//   res.status(201).json({
//     success: true,
//     data: trainerData,
//   });
// });

const getTrainerData = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const trainer = await trainerModel
    .findById(id)
    .populate("qualificationsAndAchievements");
  if (!trainer) {
    return next(new AppError("Trainer data not found", 404));
  }
  const activeSubscribersCount = await trainer.fetchActiveSubscribers();
  const data = trainer.toObject();
  data.activeSubscribers = activeSubscribersCount;

  res.status(201).json({
    success: true,
    data,
  });
});

const getTrainerAbout = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const fieldsToSelect =
    "specializations yearsOfExperience socialMedia country state city phoneNumber birthDate biography gender profilePhoto";

  const data = await trainerModel.findById(id).select(fieldsToSelect);

  if (!data) {
    return next(new AppError("No trainer found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    data,
  });
});
const updateTrainerAbout = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const {
    country,
    state,
    city,
    phoneNumber,
    birthDate,
    biography,
    gender,
    specializations,
    yearsOfExperience,
    socialMedia,
  } = req.body;

  const updateData = {
    country,
    state,
    city,
    phoneNumber,
    birthDate,
    biography,
    gender,
    specializations,
    yearsOfExperience,
    socialMedia,
  };

  const data = await trainerModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!data) {
    return next(new AppError("Trainer not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Trainer information updated successfully",
    data,
  });
});

const getAllReviews = catchAsyncError(async (req, res) => {
  const trainerId = req.user.payload.id;
  const { traineeId } = req.params;

  const reviewData = await getReviewsData(trainerId, traineeId);
  res.status(200).json(reviewData);
});

const getAllSubscriptions = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  let traineeIds = [];

  if (req.query.keywords) {
    const nameParts = req.query.keywords.split(" ");
    let query = {};

    if (nameParts.length > 1) {
      // Assume the first part is the first name and the second part is the last name
      query = {
        $or: [
          {
            firstName: { $regex: nameParts[0], $options: "i" },
            lastName: { $regex: nameParts[1], $options: "i" },
          },
          {
            firstName: { $regex: nameParts[1], $options: "i" },
            lastName: { $regex: nameParts[0], $options: "i" },
          },
        ],
      };
    } else {
      // Search either first name or last name if only one part is provided
      query = {
        $or: [
          { firstName: { $regex: req.query.keywords, $options: "i" } },
          { lastName: { $regex: req.query.keywords, $options: "i" } },
        ],
      };
    }

    const trainees = await traineeModel.find(query).select("_id");
    traineeIds = trainees.map((trainee) => trainee._id);
  }

  let baseQuery = SubscriptionModel.find({
    trainerId: id,
    ...(traineeIds.length > 0 && { traineeId: { $in: traineeIds } }), // Use trainee IDs from the search result
  })
    .select("startDate paidAmount status subscriptionType duration")
    .populate({
      path: "traineeId",
      select: "firstName lastName",
      match: { _id: { $ne: null } }, // Ensures only populated if traineeId exists
    })
    .populate({
      path: "package",
      select: "packageName -_id",
    });

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .filter()
    .sort()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery;
  subscriptions = subscriptions.filter(
    (subscription) => subscription.traineeId !== null
  );
  if (!subscriptions || subscriptions.length === 0) {
    res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No subscriptions found",
      data: [],
    });
    return;
  }

  const data = subscriptions.map((subscription) => ({
    id: subscription._id,
    firstName: subscription.traineeId?.firstName || "No Name ",
    lastName: subscription.traineeId?.lastName || "No Name ",
    // fullName: `${subscription.traineeId.firstName} ${subscription.traineeId.lastName}`,
    packageName: subscription.package?.packageName || "No Package",
    status: subscription.status,
    startDate: subscription.startDate,
    // ? subscription.startDate.toISOString().split("T")[0]
    // : null,
    duration: subscription.duration,
    subscriptionType: subscription.subscriptionType,
    Amount: subscription.paidAmount,
  }));

  let totalCount = await SubscriptionModel.find(
    apiFeatures.mongooseQuery.getQuery()
  ).countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Subscriptions information retrieved successfully",
    data,
  });
});

export {
  updatePersonalInfo,
  getTrainerInfo,
  updateProfessionalCredentials,
  getProfessionalCredentials,
  submitionrequests,
  getTrainerData,
  getTrainerAbout,
  updateTrainerAbout,
  getAllReviews,
  getAllSubscriptions,
};
