import { Router } from "express";
const adminTrainerRouter = Router();
import * as trainer from "../trainer/trainer.controller.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";

adminTrainerRouter.get(
  "/PendingTrainers",
  verifyToken,
  allowedTo("admin"),
  trainer.getPendingTrainers
);

adminTrainerRouter.get(
  "/personalinfo/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getTrainerInfo
);
adminTrainerRouter.get(
  "/ProfessionalCredentials/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getProfessionalCredentials
);
adminTrainerRouter.get(
  "/ClientTransformations/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getClientTransformations
);
adminTrainerRouter.get(
  "/packages/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getTrainerpackages
);
adminTrainerRouter.get(
  "/QualificationsAndAchievements/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getTrainerQualificationsAndAchievements
);
adminTrainerRouter.patch(
  "/adminApprove/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.adminApprove
);
adminTrainerRouter.get(
  "/TrainerInfoBar/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getTrainerInfoBar
);

//////////////////////////////////////////////

adminTrainerRouter.get(
  "/getTrainerDetails/:id",
  verifyToken,
  allowedTo("admin"),
  trainer.getTrainerDetails
);

adminTrainerRouter.get(
  "/getAllTrainersRequests",
  verifyToken,
  allowedTo("admin"),
  trainer.getAllTrainersRequests
);

// adminTrainerRouter.post(
//   "/manageTraineeBlockStatus/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.manageTraineeBlockStatus
// );
// adminTrainerRouter.post(
//   "/manageTrainerBlockStatus/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.manageTrainerBlockStatus
// );

// adminTrainerRouter.delete(
//   "/adminDeleteUser/:id",
//   verifyToken,
//   allowedTo("admin"),
//   admin.adminDeleteUser
// );
export default adminTrainerRouter;
