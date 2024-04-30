import { Router } from "express";
const traineeExploreRouter = Router();
import * as explore from "./explore.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

traineeExploreRouter.get("/trainers", verifyToken,allowedTo("trainee"),explore.getAllTrainers);
traineeExploreRouter.get("/trainers/:trainerId/about", explore.getTrainerAbout);
traineeExploreRouter.get("/trainers/:trainerId/transformations", explore.getClientTransformations);

traineeExploreRouter.post('/trainers/:trainerId/toggle-favorite', verifyToken, allowedTo("trainee"), explore.toggleFavorite);
traineeExploreRouter.get("/favorites",verifyToken,allowedTo("trainee"),explore.getAllFavorites);

export default traineeExploreRouter;