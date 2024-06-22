import { Router } from "express";
const tranieeheartRate = Router();
import * as heartRate from "./heartRate.controller.js";
import { allowedTo, verifyToken } from "../../../../middlewares/authToken.js";

tranieeheartRate.post(
  "/",
  verifyToken,
  allowedTo("trainee"),
  heartRate.recordHeartRate
);
tranieeheartRate.get(
  "/",
  verifyToken,
  allowedTo("trainee"),
  heartRate.getLastHeartRateRecord
);

// GET endpoint for fetching weekly heart rate records
tranieeheartRate.get(
  "/weekly-heart-rate",
  verifyToken,
  allowedTo("trainee"),
  heartRate.getWeeklyHeartRateRecords
);

export default tranieeheartRate;
