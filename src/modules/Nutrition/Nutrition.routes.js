import { Router } from "express";
const NutritionRouter = Router();
import * as Nutrition from "./Nutrition.controller.js";
import { allowedTo, verifyToken } from "../../middlewares/authToken.js";

NutritionRouter.post(
  "/",
  verifyToken,
  allowedTo("trainer"),
  Nutrition.addNutritionPlan
);
NutritionRouter.patch(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  Nutrition.updateNutritionPlan
);

NutritionRouter.get(
  "/",
  verifyToken,
  allowedTo("trainer"),
  Nutrition.getNutritionPlans
);
NutritionRouter.get(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  Nutrition.getSpecificNutritionPlan
);
NutritionRouter.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  Nutrition.deleteNutritionPlan
);

export default NutritionRouter;
