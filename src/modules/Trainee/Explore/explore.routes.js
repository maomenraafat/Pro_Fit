import { Router } from "express";
const traineeExploreRouter = Router();
import * as explore from "./explore.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

traineeExploreRouter.get("/trainers", verifyToken,allowedTo("trainee"),explore.getAllTrainers);
traineeExploreRouter.get("/trainers/:trainerId/about", explore.getTrainerAbout);
traineeExploreRouter.get("/trainers/:trainerId/transformations", explore.getClientTransformations);
traineeExploreRouter.get("/trainers/:trainerId/free-plans",verifyToken,allowedTo("trainee"),explore.getNutritionFreePlansForTrainer);
traineeExploreRouter.post('/trainers/:trainerId/toggle-favorite', verifyToken, allowedTo("trainee"), explore.toggleFavorite);
traineeExploreRouter.get("/favorites",verifyToken,allowedTo("trainee"),explore.getAllFavorites);

export default traineeExploreRouter;