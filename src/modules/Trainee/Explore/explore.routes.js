import { Router } from "express";
const traineeExploreRouter = Router();
import * as explore from "./explore.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

traineeExploreRouter.get("/trainers", explore.getAllTrainers);
traineeExploreRouter.get("/trainers/:trainerId", explore.getTrainerDetails);

traineeExploreRouter.get("/trainers/:trainerId/favorite",explore.getTrainerDetails);

traineeExploreRouter.post("/trainers/:trainerId/favorite",verifyToken,allowedTo("trainee"),explore.addFavorite);
traineeExploreRouter.delete("/trainers/:trainerId/favorite",verifyToken,allowedTo("trainee"),explore.removeFavorite);
traineeExploreRouter.get("/favorites",verifyToken,allowedTo("trainee"),explore.getAllFavorites);

export default traineeExploreRouter;