import { Router } from "express";
const trainerTraineesRouter = Router();
import * as trainee from "./trainee.controller.js";
import {
  allowedTo,
  restrictAccess,
  verifyToken,
} from "../../../middlewares/authToken.js";

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
trainerTraineesRouter.get(
  "/getAllCustomizePlans/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getAllCustomizePlans
);
trainerTraineesRouter.get(
  "/getTraineeCustomizePlan/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeCustomizePlan
);
trainerTraineesRouter.get(
  "/getTraineeDietAssessment/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeDietAssessment
);
trainerTraineesRouter.patch(
  "/createTraineeCustomizePlan/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.createTraineeCustomizePlan
);
trainerTraineesRouter.get(
  "/getTraineesSubscription/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineesSubscription
);
trainerTraineesRouter.get(
  "/trackingTraineePlans/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.trackingTraineePlans
);

// GET endpoint for trainer to view a trainee's water intake details
trainerTraineesRouter.get(
  "/water/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeWaterIntakeForTrainer
);

// PATCH endpoint for trainer to update a trainee's water goal
trainerTraineesRouter.patch(
  "/water/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.updateTraineeWaterGoal
);

trainerTraineesRouter.get(
  "/water/last-seven-days/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeWeeklyWaterIntakeForTrainer
);

//GET endpoint to get Heart Rate Record of the trainer
trainerTraineesRouter.get(
  "/heart-rating/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeLatestHeartRateRecord
);

trainerTraineesRouter.get(
  "/heart-rating/last-five/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getLastFiveHeartRateRecords
);

// GET endpoint for trainer to view a trainee's steps of today
trainerTraineesRouter.get(
  "/steps/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTodayStepsForTrainer
);

trainerTraineesRouter.get(
  "/steps/last-seven-days/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getWeeklyStepsForTrainer
);

// PATCH endpoint for trainer to update a trainee's step goal
trainerTraineesRouter.patch(
  "/steps/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.updateTraineeStepGoalForTrainer
);

// GET endpoint to get the latest sleep data of the trainee for the trainer
trainerTraineesRouter.get(
  "/sleep-tracking/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeLatestSleepData
);

// GET endpoint for trainer to view a trainee's progress entries
trainerTraineesRouter.get(
  "/progress/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getTraineeProgressForTrainer
);

// GET endpoint for trainer to view diet assessment measurements of a specific trainee
trainerTraineesRouter.get(
  "/measurements/:id",
  verifyToken,
  allowedTo("trainer"),
  trainee.getDietAssessmentMeasurementsForTrainer
);
export default trainerTraineesRouter;
