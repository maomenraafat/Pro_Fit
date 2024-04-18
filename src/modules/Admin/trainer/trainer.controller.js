import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { AppError } from "../../../utils/AppError.js";
import { sendEmail } from "../../../../email/nodemailer.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { PackageModel } from "../../../../Database/models/Package.model.js";
import { QualificationAndAchievementModel } from "../../../../Database/models/qualificationsAndAchievements.model.js";

const getPendingTrainers = catchAsyncError(async (req, res, next) => {
  const data = await trainerModel.find({ status: "pending" });
  if (!data) {
    next(
      new AppError("Trainer was not found or you're not authorized to do that")
    );
  }
  res.status(200).json({ message: "success", data });
});
const getTrainerInfo = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await trainerModel
    .findById(id)
    .select(
      "country state city phoneNumber birthDate biography gender profilePhoto"
    );
  if (!data) {
    return next(new AppError("No trainer found with that ID", 404));
  }
  res.status(200).json({
    success: true,
    data,
  });
});
const getProfessionalCredentials = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await trainerModel
    .findById(id)
    .select("specializations yearsOfExperience  socialMedia");
  if (!data) {
    return next(new AppError("No trainer found with that ID", 404));
  }
  res.status(200).json({
    success: true,
    data,
  });
});
const getClientTransformations = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await ClientTransformationModel.find({
    trainerId: id,
  });
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(201).json({
    success: true,
    data,
  });
});
const getTrainerpackages = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await PackageModel.find({
    trainerId: id,
  });
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(201).json({
    success: true,
    message: " success",
    data,
  });
});
const getTrainerQualificationsAndAchievements = catchAsyncError(
  async (req, res, next) => {
    const id = req.params.id;
    const data = await QualificationAndAchievementModel.find({
      trainer: id,
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
const adminApprove = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!id || !status) {
    return next(new AppError("Trainer ID and status are required.", 400));
  }
  const data = await trainerModel.findByIdAndUpdate(
    id,
    { status: status },
    { new: true }
  );
  if (!data) {
    return next(new AppError("Trainer not found.", 404));
  }
  // // If the admin has accepted the trainer, send the congratulatory email
  // console.log(status);
  // if (status === "accepted") {
  //   const signInLink = `${req.protocol}://${req.headers.host}/signIn`; // replace '/signIn' with your frontend's sign-in route
  //   const sentEmail = await sendEmail(
  //     {
  //       email: trainer.email,
  //       firstName: trainer.firstName,
  //       lastName: trainer.lastName,
  //     },
  //     null, // no token needed in this case
  //     req.protocol,
  //     req.headers.host,
  //     null, // no action needed in this case
  //     "acceptanceEmail" // new messageType
  //   );
  //   if (!sentEmail) {
  //     return next(new AppError("Email could not be sent", 500));
  //   }
  //}
  if (status === "accepted") {
    res
      .status(200)
      .json({ message: "Trainer has been successfully accepted", data });
  } else if (status === "rejected") {
    res
      .status(200)
      .json({ message: "Trainer has been successfully rejected", data });
  }
});
const getTrainerInfoBar = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await trainerModel
    .findById(id)
    .select("profilePhoto firstName lastName email phoneNumber");
  if (!data) {
    return next(new AppError("No trainer found with that ID", 404));
  }
  res.status(200).json({
    success: true,
    data,
  });
});
////////////////////////////////////////////////////////////////

const getTrainerDetails = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const data = await trainerModel.findById(id);
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(200).json({ message: "success", data });
});

const getAllTrainersRequests = catchAsyncError(async (req, res, next) => {
  const data = await trainerModel.find({ status: "incomplete" });
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(200).json({ message: "success", data });
});

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
  getPendingTrainers,
  getTrainerInfo,
  getProfessionalCredentials,
  getClientTransformations,
  getTrainerpackages,
  getTrainerQualificationsAndAchievements,
  adminApprove,
  getTrainerInfoBar,
  ////////////////////////////////////////////////////////////////
  getTrainerDetails,
  getAllTrainersRequests,

  // manageTrainerBlockStatus,
  // manageTraineeBlockStatus,
  // adminDeleteUser,
};
