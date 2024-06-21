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

// GET endpoint for fetching step goals list
tranieeRecordSteps.get("/step-goals", verifyToken, allowedTo("trainee"), steps.getStepGoalsList);

// GET endpoint for fetching weekly steps
tranieeRecordSteps.get("/weekly-steps", verifyToken, allowedTo("trainee"), steps.getWeeklyStepsForTrainee);

export default tranieeRecordSteps;
