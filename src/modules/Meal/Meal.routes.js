import { Router } from "express";
const MealRouter = Router();
import * as Meal from "./Meal.controller.js";
import { allowedTo, verifyToken } from "../../middlewares/authToken.js";

MealRouter.post("/", verifyToken, allowedTo("trainer", "admin"), Meal.addMeal);
MealRouter.patch(
  "/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  Meal.updateMeal
);
MealRouter.patch(
  "/updateMealIngredients/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  Meal.updateMealIngredients
);

MealRouter.get("/", verifyToken, allowedTo("trainer", "admin"), Meal.getMeal);
MealRouter.get(
  "/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  Meal.getSpecificMeal
);
MealRouter.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  Meal.deleteMeal
);

export default MealRouter;
