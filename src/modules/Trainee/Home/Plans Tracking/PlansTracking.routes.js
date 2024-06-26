import { Router } from "express";
const tranieeplansTracking = Router();
import * as plansTracking from "./plansTracking.controller.js";
import { allowedTo, verifyToken } from "../../../../middlewares/authToken.js";

tranieeplansTracking.get(
  "/trackingCurrentPlan",
  verifyToken,
  allowedTo("trainee"),
  plansTracking.trackingCurrentPlan
);
tranieeplansTracking.get(
  "/",
  verifyToken,
  allowedTo("trainee"),
  plansTracking.trackingPlans
);

export default tranieeplansTracking;
