import { traineeModel } from "../../../../Database/models/Trainee.model.js";
import { traineeBasicInfoModel } from "../../../../Database/models/traineeBasicInfo.model.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import bcrypt from "bcrypt";
import moment from "moment";
import { cloudinary } from "../../../utils/cloudinary.js";
import stream from "stream";

const profileSettings = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const data = await traineeModel.findById(
    traineeId,
    "firstName lastName email profilePhoto"
  );
  if (!data) {
    return next(new AppError("User was not found!", 404));
  }
  res
    .status(200)
    .json({ success: true, message: "Data fetched succesfully", data });
});

const getAccountData = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const data = await traineeModel.findById(
    traineeId,
    "firstName lastName email profilePhoto phoneNumber"
  );

  if (!data) {
    return next(new AppError("User was not found!", 404));
  }

  res
    .status(200)
    .json({ success: true, message: "Data fetched successfully", data });
});

const updateAccountData = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  let trainee = await traineeModel.findById(traineeId);

  if (!trainee) {
    return next(new AppError("User not found!", 404));
  }

  // Update other fields as necessary...
  trainee.firstName = req.body.firstName || trainee.firstName;
  trainee.lastName = req.body.lastName || trainee.lastName;
  trainee.email = req.body.email || trainee.email;
  trainee.phoneNumber = req.body.phoneNumber || trainee.phoneNumber;

  if (req.files["profilePhoto"] && req.files["profilePhoto"].length > 0) {
    const file = req.files["profilePhoto"][0];

    // If an old photo exists, delete it from Cloudinary
    if (trainee.profilePhotoId) {
      await cloudinary.uploader.destroy(trainee.profilePhotoId);
    }

    // Upload the new photo to Cloudinary
    if (file) {
      const folderName = `Trainee/${trainee.firstName}_${trainee.lastName}/profilePhoto`;
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folderName },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        const bufferStream = new stream.PassThrough(); // Create a PassThrough stream
        bufferStream.end(file.buffer); // End the stream by passing the buffer
        bufferStream.pipe(uploadStream); // Pipe it to uploadStream
      });

      // Update the trainee document with the new photo's URL and public ID
      trainee.profilePhoto = result.secure_url;
      trainee.profilePhotoId = result.public_id;
    }
  }

  await trainee.save();
  res.status(200).json({
    success: true,
    message: "Account data updated successfully",
    data: trainee,
  });
});

const getPersonalData = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  // Use .lean() to get a plain JavaScript object
  const personalData = await traineeBasicInfoModel
    .findOne({ trainee: traineeId })
    .lean();

  if (!personalData) {
    return next(new AppError("Personal data not found!", 404));
  }

  // Now you can safely modify it because it's a plain object
  personalData.birthDate = moment(personalData.birthDate).format("YYYY-MM-DD");

  res.status(200).json({
    success: true,
    message: "Personal data fetched successfully",
    data: personalData,
  });
});

const updatePersonalData = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const updateData = req.body; // Data to update

  // Perform the update operation
  const updatedPersonalData = await traineeBasicInfoModel.findOneAndUpdate(
    { trainee: traineeId },
    updateData,
    { new: true, runValidators: true, lean: true }
  );

  if (!updatedPersonalData) {
    return next(new AppError("Personal data not found!", 404));
  }

  // Format the date in YYYY-MM-DD format
  if (updatedPersonalData.birthDate instanceof Date) {
    updatedPersonalData.birthDate = updatedPersonalData.birthDate
      .toISOString()
      .split("T")[0];
  }

  res.status(200).json({
    success: true,
    message: "Personal data updated successfully",
    data: updatedPersonalData,
  });
});

const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return next(
      new AppError("New password and confirmation password do not match.", 400)
    );
  }

  const userId = req.user.payload.id;

  // Check if old and new passwords are provided
  if (!oldPassword || !newPassword) {
    return next(new AppError("Please provide old and new passwords!", 400));
  }

  // Find the trainee by userId
  const trainee = await traineeModel.findById(userId).select("+password");

  if (!trainee) {
    return next(new AppError("Trainee not found", 404));
  }

  // Check if the old password is correct
  const isMatch = await bcrypt.compare(oldPassword, trainee.password);
  if (!isMatch) {
    return next(new AppError("Your old password is incorrect", 401));
  }

  // Set the new password directly and let mongoose middleware handle the hashing
  trainee.password = newPassword;

  // Save the trainee with the new password
  await trainee.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully!",
  });
});

const deleteAccount = catchAsyncError(async (req, res, next) => {
  const userId = req.user.payload.id;

  const trainee = await traineeModel.findById(userId);

  if (!trainee) {
    return next(new AppError("Trainee not found", 404));
  }

  // Delete the trainee's account
  await traineeModel.deleteOne({ _id: userId });

  // Respond to the request indicating the account has been deleted
  res.status(200).json({
    success: true,
    message: "Account deleted successfully.",
  });
});

export {
  profileSettings,
  getAccountData,
  updateAccountData,
  getPersonalData,
  updatePersonalData,
  changePassword,
  deleteAccount,
};
