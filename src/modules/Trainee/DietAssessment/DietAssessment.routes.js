import { Router } from "express";
const DietAssessmentRouter = Router();
import * as DietAssessment from "./DietAssessment.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

DietAssessmentRouter.get(
  "/FirstDiestAssessment",
  verifyToken,
  allowedTo("trainee"),
  DietAssessment.getFirstDiestAssessment
);
DietAssessmentRouter.patch(
  "/FillFirstDiestAssessment",
  verifyToken,
  allowedTo("trainee"),
  DietAssessment.FillFirstDietAssessment
);

export default DietAssessmentRouter;
