import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { adminModel } from "../../../Database/models/admin.model.js";
import { trainerModel } from "../../../Database/models/Trainer.model.js";
import { determineFolderName } from "../../multer/multer.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";

async function handleImageUpload(admin, file) {
  const simulatedReq = {
    user: {
      payload: admin,
    },
  };
  const folderName = determineFolderName(simulatedReq, "profilePhoto");
  const existingImageHash = admin.profilePhotoHash;

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

const updatePersonalInfo = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const { firstName, lastName, email, password } = req.body;
  let updateData = {
    firstName,
    lastName,
    email,
    password,
  };
  const admin = await adminModel.findById(id);
  if (!admin) {
    return next(new Error("admin not found"));
  }
  if (req.files["profilePhoto"] && req.files["profilePhoto"][0]) {
    const file = req.files["profilePhoto"][0];
    const imageUploadResult = await handleImageUpload(admin, file);
    if (imageUploadResult) {
      updateData = { ...updateData, ...imageUploadResult };
    }
  }
  const data = await adminModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!data) {
    return next(new Error("Data not found"));
  }
  res.status(201).json({
    success: true,
    message: "Data updated successfully",
    data,
  });
});
const getAdminInfo = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const data = await adminModel
    .findById(id)
    .select("firstName lastName email password profilePhoto role");
  if (!data) {
    return next(new AppError("No data found ", 404));
  }
  res.status(200).json({
    success: true,
    data,
  });
});

// const getAllTrainees = catchAsyncError(async (req, res, next) => {
//   const data = await traineeModel.find({ role: "trainee" });
//   if (!data) {
//     return next(new AppError("data not found", 404));
//   }
//   res.status(200).json({ message: "success", data });
// });

// const getAllTrainers = catchAsyncError(async (req, res, next) => {
//   const data = await trainerModel.find({ role: "trainer" });
//   if (!data) {
//     next(
//       new AppError("Trainer was not found or you're not authorized to do that")
//     );
//   }
//   res.status(200).json({ message: "success", data });
// });

// const getTraineeDetails = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const data = await traineeModel.findById(id);
//   if (!data) {
//     next(
//       new AppError("Trainee was not found or you're not authorized to do that")
//     );
//   }
//   res.status(200).json({ message: "success", data });
// });

// const getTrainerDetails = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const data = await trainerModel.findById(id);
//   if (!data) {
//     return next(new AppError("data not found", 404));
//   }
//   res.status(200).json({ message: "success", data });
// });

// const getAllTrainersRequests = catchAsyncError(async (req, res, next) => {
//   const data = await trainerModel.find({ status: "incomplete" });
//   if (!data) {
//     return next(new AppError("data not found", 404));
//   }
//   res.status(200).json({ message: "success", data });
// });

// const adminApprove = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   if (!id || !status) {
//     return next(new AppError("Trainer ID and status are required.", 400));
//   }
//   const trainer = await trainerModel.findByIdAndUpdate(
//     id,
//     { status: status },
//     { new: true }
//   );
//   if (!trainer) {
//     return next(new AppError("Trainer not found.", 404));
//   }
//   // If the admin has accepted the trainer, send the congratulatory email
//   console.log(status);
//   if (status === "accepted") {
//     const signInLink = `${req.protocol}://${req.headers.host}/signIn`; // replace '/signIn' with your frontend's sign-in route
//     const sentEmail = await sendEmail(
//       {
//         email: trainer.email,
//         firstName: trainer.firstName,
//         lastName: trainer.lastName,
//       },
//       null, // no token needed in this case
//       req.protocol,
//       req.headers.host,
//       null, // no action needed in this case
//       "acceptanceEmail" // new messageType
//     );
//     if (!sentEmail) {
//       return next(new AppError("Email could not be sent", 500));
//     }
//   }
//   res
//     .status(200)
//     .json({ message: "Trainer status updated successfully.", trainer });
// });

// const manageTraineeBlockStatus = catchAsyncError(async (req, res, next) => {
//   // Check if requester is admin
//   if (!req.user || !req.user.payload.isAdmin) {
//     return res.status(403).json({
//       success: false,
//       message:
//         "Access denied. Only admins can manage block status of trainees.",
//     });
//   }
//   // Check the action (block/unblock)
//   const action = req.body.action; // Assuming action is sent in request body
//   // Proceed with updating the block status of the trainee
//   const trainee = await traineeModel.findById(req.params.id);
//   if (!trainee) {
//     return res
//       .status(404)
//       .json({ success: false, message: "Trainee not found." });
//   }
//   trainee.isBlock = action === "block";
//   await trainee.save();
//   res.status(200).json({
//     success: true,
//     message:
//       action === "block"
//         ? "Trainee blocked successfully."
//         : "Trainee unblocked successfully.",
//   });
// });

// const manageTrainerBlockStatus = catchAsyncError(async (req, res, next) => {
//   // Check if requester is admin
//   if (!req.user || !req.user.payload.isAdmin) {
//     return res.status(403).json({
//       success: false,
//       message:
//         "Access denied. Only admins can manage block status of trainers.",
//     });
//   }

//   // Check the action (block/unblock)
//   const action = req.body.action; // Assuming action is sent in request body

//   // Proceed with updating the block status of the trainer
//   const trainer = await adminModel.findById(req.params.id);
//   if (!trainer) {
//     return res
//       .status(404)
//       .json({ success: false, message: "Trainer not found." });
//   }

//   trainer.isBlock = action === "block";
//   await trainer.save();

//   res.status(200).json({
//     success: true,
//     message:
//       action === "block"
//         ? "Trainer blocked successfully."
//         : "Trainer unblocked successfully.",
//   });
// });

// const adminDeleteUser = catchAsyncError(async (req, res) => {
//   // The adminAuthToken middleware ensures only admins can reach this point
//   const { userId } = req.params;
//   const { accountType } = req.body; // accountType should be 'trainer' or 'trainee'
//   const model = accountType === "trainer" ? adminModel : traineeModel;
//   // Use the common delete function
//   const result = await deleteUser(userId, model);
//   return res.status(result.status).json({ message: result.message });
// });

export {
  updatePersonalInfo,
  getAdminInfo,
  // getAllTrainees,
  // getAllTrainers,
  // getTraineeDetails,
  // getTrainerDetails,
  // getAllTrainersRequests,
  // adminApprove,
  // manageTrainerBlockStatus,
  // manageTraineeBlockStatus,
  // adminDeleteUser,
};
