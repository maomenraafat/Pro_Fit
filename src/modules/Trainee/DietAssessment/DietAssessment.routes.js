import { Router } from "express";
const DietAssessmentRouter = Router();
import * as DietAssessment from "./DietAssessment.controller.js";
import {
  allowedTo,
  restrictAccess,
  verifyToken,
} from "../../../middlewares/authToken.js";

DietAssessmentRouter.get(
  "/DietAssessments",
  verifyToken,
  allowedTo("trainee"),
  DietAssessment.getDietAssessments
);
DietAssessmentRouter.get(
  "/getDietAssessmentsData",
  // verifyToken,
  // allowedTo("trainee"),
  DietAssessment.getDietAssessmentsData
);
DietAssessmentRouter.post(
  "/FillDietAssessment",
  verifyToken,
  allowedTo("trainee"),
  restrictAccess(
    "dietAssessmentStatus",
    ["In Preparation", "Working", "Pending"],
    "id",
    true
  ),
  DietAssessment.FillDietAssessment
);

export default DietAssessmentRouter;
