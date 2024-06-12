import { Router } from "express";
const tranieeplansTracking = Router();
import * as plansTracking from "./plansTracking.controller.js";
import { allowedTo, verifyToken } from "../../../../middlewares/authToken.js";

tranieeplansTracking.get(
  "/",
  verifyToken,
  allowedTo("trainee"),
  plansTracking.trackingPlans
);

export default tranieeplansTracking;
