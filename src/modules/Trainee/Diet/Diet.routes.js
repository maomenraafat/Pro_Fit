import { Router } from "express";
const DietRouter = Router();
import * as Diet from "./Diet.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

DietRouter.get(
  "/getCustomizeDietPlan",
  verifyToken,
  allowedTo("trainee"),
  Diet.getCustomizeDietPlan
);

export default DietRouter;
