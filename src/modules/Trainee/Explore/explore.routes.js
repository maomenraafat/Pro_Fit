import { Router } from "express";
const traineeExploreRouter = Router();
import * as explore from "./explore.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

traineeExploreRouter.get("/trainers", verifyToken,allowedTo("trainee"),explore.getAllTrainers);
traineeExploreRouter.get("/trainers/:trainerId/about", explore.getTrainerAbout);
traineeExploreRouter.get("/trainers/:trainerId/transformations", explore.getClientTransformations);
traineeExploreRouter.get("/trainers/:trainerId/free-plans",verifyToken,allowedTo("trainee"),explore.getNutritionFreePlansForTrainer);
traineeExploreRouter.get("/trainers/diet-free-plans",verifyToken,allowedTo("trainee"),explore.getAllNutritionFreePlans);
traineeExploreRouter.get("/trainers/calorie-filters",verifyToken,allowedTo("trainee"),explore.caloriesFilter);
traineeExploreRouter.post('/trainers/:trainerId/trainer-toggle-favorite', verifyToken, allowedTo("trainee"), explore.trainertoggleFavorite);
traineeExploreRouter.get("/favorites/trainers",verifyToken,allowedTo("trainee"),explore.getAllFavorites);
traineeExploreRouter.post('/trainers/:dietPlanId/diet-toggle-favorite', verifyToken, allowedTo("trainee"), explore.toggleFavoriteDietPlan);
traineeExploreRouter.get('/favorites/free-diet-plan', verifyToken, allowedTo("trainee"), explore.getAllFavoriteDietPlans);
traineeExploreRouter.get('/trainers/daily-needs', verifyToken, allowedTo("trainee"), explore.getDailyNeeds);
traineeExploreRouter.get('/trainers/diet-types', explore.getDietTypes);
traineeExploreRouter.get('/trainers/meals-count', explore.getMealsCounts);

export default traineeExploreRouter;