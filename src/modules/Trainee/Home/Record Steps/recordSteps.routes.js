import { Router } from "express";
const tranieeRecordSteps = Router();
import * as steps from "./recordSteps.controller.js";
import { allowedTo , verifyToken } from "../../../../middlewares/authToken.js";


// POST endpoint for setting a step goal
tranieeRecordSteps.post("/goal", verifyToken, allowedTo("trainee"), steps.setGoal);

// POST endpoint for recording daily steps
tranieeRecordSteps.post("/", verifyToken, allowedTo("trainee"), steps.recordSteps);

// GET endpoint for fetching today's steps
tranieeRecordSteps.get("/", verifyToken, allowedTo("trainee"), steps.getTodaySteps);


// PUT endpoint for trainer to update a trainee's step goal
tranieeRecordSteps.patch("/goal/:traineeId", verifyToken, allowedTo("trainer"), steps.updateTraineeStepGoalForTrainer);

// GET endpoint for trainer to view a trainee's steps of today
tranieeRecordSteps.get("/:traineeId", verifyToken, allowedTo("trainer"), steps.getTodayStepsForTrainer);
export default tranieeRecordSteps;
