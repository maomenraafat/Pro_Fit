import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { QualificationAndAchievementModel } from "../../../../Database/models/qualificationsAndAchievements.model.js";
import { AppError } from "../../../utils/AppError.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { determineFolderName } from "../../../multer/multer.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";

async function handleQualificationImageUpload(trainer, file) {
  if (!trainer) {
    throw new Error("Trainer not found");
  }

  const folderName = determineFolderName(
    { user: { payload: trainer } },
    "photo"
  );
  const existingImageHash = trainer.qualificationAndAchievementPhotoHash; // This field should exist in the trainer model

  const uploadResult = await uploadImageToCloudinary(
    file,
    folderName,
    existingImageHash
  );
  if (uploadResult) {
    return {
      photoUrl: uploadResult.url,
      photoHash: uploadResult.hash,
    };
  }

  throw new Error("Failed to upload image");
}

// const addQualificationAndAchievement = catchAsyncError(
//   async (req, res, next) => {
//     const trainerId = req.user.payload.id;
//     const data = {
//       trainer: trainerId,
//     };
//     console.log(req.file);
//     if (req.file) {
//       data.photo = req.file.path;
//     } else {
//       return next(
//         new AppError(
//           "Photo is required for qualifications and achievements",
//           400
//         )
//       );
//     }
//     const newQualificationAndAchievement = new QualificationAndAchievementModel(
//       data
//     );
//     await newQualificationAndAchievement.save();
//     res.status(201).json({
//       success: true,
//       message: "Image saved successfully",
//       data: newQualificationAndAchievement,
//     });
//   }
// );

// Retrieve a specific qualification or achievement

// const addQualificationAndAchievement = catchAsyncError(
//   async (req, res, next) => {
//     const trainerId = req.user.payload.id;
//     const trainer = await trainerModel.findById(trainerId);

//     if (!trainer) {
//       return next(new Error("Trainer not found"));
//     }

//     if (!req.file) {
//       return next(
//         new AppError(
//           "Photo is required for qualifications and achievements",
//           400
//         )
//       );
//     }

//     const imageUploadResult = await handleQualificationImageUpload(
//       trainer,
//       req.file
//     );

//     if (!imageUploadResult) {
//       return next(new Error("Image upload failed"));
//     }

//     const data = {
//       trainer: trainerId,
//       ...imageUploadResult,
//     };

//     const newQualificationAndAchievement = new QualificationAndAchievementModel(
//       data
//     );
//     await newQualificationAndAchievement.save();

//     res.status(201).json({
//       success: true,
//       message: "Image and data saved successfully",
//       data: newQualificationAndAchievement,
//     });
//   }
// );
const addQualificationAndAchievement = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    const trainer = await trainerModel.findById(trainerId);

    if (!trainer) {
      return next(new Error("Trainer not found"));
    }

    if (!req.file) {
      return next(
        new AppError(
          "Photo is required for qualifications and achievements",
          400
        )
      );
    }

    const imageUploadResult = await handleQualificationImageUpload(
      trainer,
      req.file
    );

    if (!imageUploadResult) {
      return next(new Error("Image upload failed"));
    }
    // Check if a similar qualification already exists
    const existingQualification =
      await QualificationAndAchievementModel.findOne({
        trainer: trainerId,
        photo: imageUploadResult.photoUrl,
      });

    if (existingQualification) {
      return next(new AppError("This qualification already exists.", 400));
    }

    const data = {
      trainer: trainerId,
      photo: imageUploadResult.photoUrl,
    };

    const newQualificationAndAchievement = new QualificationAndAchievementModel(
      data
    );
    await newQualificationAndAchievement.save();
    trainer.qualificationsAndAchievements.push(
      newQualificationAndAchievement._id
    );
    await trainer.save();

    res.status(201).json({
      success: true,
      message: "Image and data saved successfully",
      data: newQualificationAndAchievement,
    });
  }
);

const getQualificationAndAchievement = catchAsyncError(
  async (req, res, next) => {
    const id = req.params.id;
    const data = await QualificationAndAchievementModel.findById(id).populate(
      "trainer"
    );
    if (!data) {
      return next(new AppError("Image not found", 404));
    }
    res.status(201).json({
      success: true,
      message: "Success",
      data,
    });
  }
);

const getTrainerQualificationsAndAchievements = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    const data = await QualificationAndAchievementModel.find({
      trainer: trainerId,
    });
    if (!data) {
      return next(new AppError(" Image not found", 404));
    }
    res.status(201).json({
      success: true,
      message: "Success",
      data,
    });
  }
);

// Update a qualification or achievement
// const updateQualificationAndAchievement = catchAsyncError(
//   async (req, res, next) => {
//     const trainerId = req.user.payload.id;
//     const id = req.params.id;
//     console.log(req.file);
//     if (req.file) {
//       data.photo = req.file.path;
//     } else {
//       return next(
//         new AppError(
//           "Photo is required for qualifications and achievements",
//           400
//         )
//       );
//     }
//     const data = await QualificationAndAchievementModel.findOneAndUpdate(
//       {
//         _id: id,
//         trainer: trainerId,
//       },
//       data,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//     res.status(201).json({
//       success: true,
//       message: "Image updated successfully",
//       data,
//     });
//   }
// );

// Delete a qualification or achievement
const deleteQualificationAndAchievement = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    const id = req.params.id;
    const deletedData = await QualificationAndAchievementModel.findOneAndDelete(
      {
        _id: id,
        trainer: trainerId,
      }
    );
    if (!deletedData) {
      return next(new AppError("Image not found", 404));
    }
    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  }
);

export {
  addQualificationAndAchievement,
  getQualificationAndAchievement,
  getTrainerQualificationsAndAchievements,
  //  updateQualificationAndAchievement,
  deleteQualificationAndAchievement,
};
