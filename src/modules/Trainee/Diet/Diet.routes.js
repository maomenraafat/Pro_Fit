import { Router } from "express";
const DietRouter = Router();
import * as Diet from "./Diet.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

DietRouter.get(
  "/getDietPlan",
  verifyToken,
  allowedTo("trainee"),
  Diet.getDietPlan
);
DietRouter.patch(
  "/setStartDateForCustomizedPlan/:id",
  verifyToken,
  allowedTo("trainee"),
  Diet.setStartDateForCustomizedPlan
);

// DietRouter.get(
//   "/getCustomizeDietPlan",
//   verifyToken,
//   allowedTo("trainee"),
//   Diet.getCustomizeDietPlan
// );
// DietRouter.get(
//   "/getSubscribedFreeDietPlan",
//   verifyToken,
//   allowedTo("trainee"),
//   Diet.getSubscribedFreeDietPlan
// );
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

DietRouter.patch(
  "/updateFoodConsumedStatus/:id",
  verifyToken,
  allowedTo("trainee"),
  Diet.updateFoodConsumedStatus
);

DietRouter.post(
  "/rate-diet-plan/:id",
  verifyToken,
  allowedTo("trainee"),
  Diet.rateDietPlan
);
// DietRouter.get("/rated-diet-plans", verifyToken, allowedTo("trainee"), Diet.getRatedDietPlans);

export default DietRouter;
