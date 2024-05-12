import { Router } from "express";
const trainerTraineesRouter = Router();
import * as trainee from "./trainee.controller.js";
import {
  allowedTo,
  restrictAccess,
  verifyToken,
} from "../../../middlewares/authToken.js";

trainerTraineesRouter.get(
  "/getTraineeCustomizePlan/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeCustomizePlan
);
trainerTraineesRouter.patch(
  "/createTraineeCustomizePlan/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.createTraineeCustomizePlan
);
trainerTraineesRouter.get(
  "/getActiveTrainees",
  verifyToken,
  allowedTo("trainer"),
  trainee.getActiveTrainees
);
trainerTraineesRouter.get(
  "/getTraineesDietAssessment",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineesDietAssessment
);
trainerTraineesRouter.get(
  "/getSpecificTrainee/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getSpecificTrainee
);
trainerTraineesRouter.patch(
  "/makeRequestAssessment/:id",
  verifyToken,
  allowedTo("trainer"),
  restrictAccess("dietAssessmentStatus", ["Working", "Pending"], "id", false),
  trainee.makeRequestAssessment
);

export default trainerTraineesRouter;
