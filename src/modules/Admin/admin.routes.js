import { Router } from "express";
const adminRouter = Router();
import * as admin from "../Admin/admin.controller.js";
import { verifyToken, allowedTo } from "../../middlewares/authToken.js";
import { uploadMixOfFiles } from "../../multer/multer.js";

let arrFields = [{ name: "profilePhoto", maxCount: 1 }];

adminRouter.patch(
  "/updatePersonalInfo",
  verifyToken,
  allowedTo("admin"),
  uploadMixOfFiles(arrFields),
  admin.updatePersonalInfo
);
adminRouter.get(
  "/PersonalInfo",
  verifyToken,
  allowedTo("admin"),
  admin.getAdminInfo
);

// adminRouter.get(
//   "/getAllTrainees",
//   verifyToken,
//   allowedTo("admin"),
//   admin.getAllTrainees
// );
// adminRouter.get(
//   "/getAllTrainers",
//   //verifyToken,
//   //allowedTo("admin"),
//   admin.getAllTrainers
// );
// adminRouter.get(
//   "/getTraineeDetails/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.getTraineeDetails
// );
// adminRouter.get(
//   "/getTrainerDetails/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.getTrainerDetails
// );
// adminRouter.patch(
//   "/approveTrainer/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.adminApprove
// );
// adminRouter.get(
//   "/getAllTrainersRequests",
//   verifyToken,
//   allowedTo("admin"),
//   admin.getAllTrainersRequests
// );

// adminRouter.post(
//   "/manageTraineeBlockStatus/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.manageTraineeBlockStatus
// );
// adminRouter.post(
//   "/manageTrainerBlockStatus/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.manageTrainerBlockStatus
// );

// adminRouter.delete(
//   "/adminDeleteUser/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.adminDeleteUser
// );
export default adminRouter;
