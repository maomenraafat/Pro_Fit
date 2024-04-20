import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { trainerModel } from "../../../Database/models/Trainer.model.js";
import { AppError } from "../../utils/AppError.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";
import { determineFolderName } from "../../multer/multer.js";
import fs from "fs";

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

const getTrainerData = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  console.log(id);
  const data = await trainerModel
    .findById({
      _id: id,
    })
    .populate("qualificationsAndAchievements");
  if (!data) {
    return next(new AppError("data not found", 404));
  }
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

export {
  updatePersonalInfo,
  getTrainerInfo,
  updateProfessionalCredentials,
  getProfessionalCredentials,
  submitionrequests,
  getTrainerData,
  getTrainerAbout,
  updateTrainerAbout,
};
