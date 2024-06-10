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

DietRouter.get(
  "/getFreeDietPlans",
  verifyToken,
  allowedTo("trainee"),
  Diet.getFreeDietPlans
);
DietRouter.get(
  "/dietPlanOverview/:id",
  verifyToken,
  allowedTo("trainee"),
  Diet.dietPlanOverview
);
DietRouter.post(
  "/subscribeToFreeDietPlan/:id",
  verifyToken,
  allowedTo("trainee"),
  Diet.subscribeToFreeDietPlan
);
DietRouter.get(
  "/getSubscribedFreeDietPlan",
  verifyToken,
  allowedTo("trainee"),
  Diet.getSubscribedFreeDietPlan
);

DietRouter.patch(
  "/updateFoodConsumedStatus",
  verifyToken,
  allowedTo("trainee"),
  Diet.updateFoodConsumedStatus
);

export default DietRouter;
