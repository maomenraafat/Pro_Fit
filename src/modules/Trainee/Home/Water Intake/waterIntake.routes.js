import { Router } from "express";
const traineeWaterIntake = Router();
import * as waterIntake from "./waterIntake.controller.js";
import { allowedTo, verifyToken } from "../../../../middlewares/authToken.js";

// POST endpoint for setting a water goal
traineeWaterIntake.post("/goal", verifyToken, allowedTo("trainee"), waterIntake.setWaterGoal);

// POST endpoint for recording water intake
traineeWaterIntake.post("/", verifyToken, allowedTo("trainee"), waterIntake.recordWaterIntake);

// GET endpoint for fetching today's water intake
traineeWaterIntake.get("/", verifyToken, allowedTo("trainee"), waterIntake.getTodayWaterIntake);

// POST endpoint for filling all the daily water needs
traineeWaterIntake.post("/fill-all", verifyToken, allowedTo("trainee"), waterIntake.fillAll);

// POST endpoint for resetting the daily water intake
traineeWaterIntake.post("/reset", verifyToken, allowedTo("trainee"), waterIntake.resetIntake);

// PUT endpoint for trainer to update a trainee's water goal
traineeWaterIntake.patch("/goal/:traineeId", verifyToken, allowedTo("trainer"), waterIntake.updateTraineeWaterGoal);

// GET endpoint for trainer to view a trainee's water intake details
traineeWaterIntake.get("/:traineeId", verifyToken, allowedTo("trainer"), waterIntake.getTraineeWaterIntakeForTrainer);



export default traineeWaterIntake;
