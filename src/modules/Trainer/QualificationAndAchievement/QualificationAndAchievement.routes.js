import { Router } from "express";
const qualificationAndAchievementRoutes = Router();
import * as QualificationAndAchievement from "./QualificationAndAchievement.controller.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";
import { uploadqualification } from "../../../multer/multer.js";

qualificationAndAchievementRoutes.post(
  "/",
  verifyToken,
  allowedTo("trainer"),
  uploadqualification(),
  QualificationAndAchievement.addQualificationAndAchievement
);

qualificationAndAchievementRoutes.get(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  QualificationAndAchievement.getQualificationAndAchievement
);

qualificationAndAchievementRoutes.get(
  "/",
  verifyToken,
  allowedTo("trainer"),
  QualificationAndAchievement.getTrainerQualificationsAndAchievements
);

// Route to update a specific qualification or achievement
// qualificationAndAchievementRoutes.patch(
//   "/:id",
//   verifyToken,
//   allowedTo("trainer"),
//   QualificationAndAchievement.updateQualificationAndAchievement
// );

qualificationAndAchievementRoutes.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  QualificationAndAchievement.deleteQualificationAndAchievement
);

export default qualificationAndAchievementRoutes;
