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

export default tranieeRecordSteps;
