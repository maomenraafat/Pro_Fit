import { Router } from "express";
const FoodRouter = Router();
import * as Food from "./Food.controller.js";
import { allowedTo, verifyToken } from "../../middlewares/authToken.js";
import { uploadFoodImage } from "../../multer/multer.js";

FoodRouter.post(
  "/",
  verifyToken,
  allowedTo("trainer", "admin"),
  uploadFoodImage(),
  Food.addFood
);
FoodRouter.patch(
  "/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  uploadFoodImage(),
  Food.updateFood
);
FoodRouter.get(
  "/",
  verifyToken,
  allowedTo("trainer", "admin"),
  Food.getProfitFoods
);
FoodRouter.get(
  "/TrainerFood",
  verifyToken,
  allowedTo("trainer"),
  Food.getTrainerFood
);
FoodRouter.get(
  "/AllFoods",
  verifyToken,
  allowedTo("trainer"),
  Food.getAllFoods
);
FoodRouter.get(
  "/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  Food.getSpecificFood
);
FoodRouter.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer", "admin"),
  Food.deleteFood
);

export default FoodRouter;
