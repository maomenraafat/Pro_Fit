import { Router } from "express";
const qualificationAndAchievementRoutes = Router();
import * as QualificationAndAchievement from "./QualificationAndAchievement.controller.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";
import { uploadqualification } from "../../../multer/multer.js";

// Route to add a new qualification or achievement
qualificationAndAchievementRoutes.post(
  "/",
  verifyToken,
  allowedTo("trainer"),
  uploadqualification(),
  QualificationAndAchievement.addQualificationAndAchievement
);

// Route to get a specific qualification or achievement
qualificationAndAchievementRoutes.get(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  QualificationAndAchievement.getQualificationAndAchievement
);

// Route to get all qualifications and achievements for a trainer
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

// Route to delete a specific qualification or achievement
qualificationAndAchievementRoutes.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  QualificationAndAchievement.deleteQualificationAndAchievement
);

export default qualificationAndAchievementRoutes;
