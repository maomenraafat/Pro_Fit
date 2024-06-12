import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { dbConnection } from "./Database/dbConnection.js";
import "./src/utils/scheduledTasks.js";
import { globalErrorHandling } from "./src/middlewares/GlobalErrorHandling.js";
import { AppError } from "./src/utils/AppError.js";
import adminRouter from "./src/modules/Admin/admin.routes.js";
import trainerRouter from "./src/modules/Trainer/Portfolio/Trainer.routes.js";
import tranieeAuthRouter from "./src/modules/Trainee/Auth/auth.routes.js";
import cors from "cors";
import trainerAuthRoutes from "./src/modules/Trainer/Auth/auth.routes.js";
import adminAuthRouter from "./src/modules/Admin/Auth/auth.routes.js";
import trainerClientTransformationsRoutes from "./src/modules/Trainer/ClientTransformations/ClientTransformations.routes.js";
import trainerpackagesRoutes from "./src/modules/Trainer/Package/Package.routes.js";
import trainerDashboardRoutes from "./src/modules/Trainer/Dashboard/Dashboard.routes.js";
import qualificationAndAchievementRoutes from "./src/modules/Trainer/QualificationAndAchievement/QualificationAndAchievement.routes.js";
import adminTrainerRouter from "./src/modules/Admin/trainer/trainer.routes.js";
import FoodRouter from "./src/modules/Food/Food.routes.js";
import MealRouter from "./src/modules/Meal/Meal.routes.js";
import tranieeProfileRouter from "./src/modules/Trainee/Profile/profile.routes.js";
import traineeExploreRouter from "./src/modules/Trainee/Explore/explore.routes.js";
import SubscriptionRouter from "./src/modules/Trainee/subscription/subscription.routes.js";
import NutritionRouter from "./src/modules/Nutrition/Nutrition.routes.js";
import traineeReviewRouter from "./src/modules/Trainee/Review/review.routes.js";
import tranieeheartRate from "./src/modules/Trainee/Home/Heart Rate/heartRate.routes.js";
import tranieeRecordSteps from "./src/modules/Trainee/Home/Record Steps/recordSteps.routes.js";
import traineeWaterIntake from "./src/modules/Trainee/Home/Water Intake/waterIntake.routes.js";
import DietAssessmentRouter from "./src/modules/Trainee/DietAssessment/DietAssessment.routes.js";
import tranieeplansTracking from "./src/modules/Trainee/Home/Plans Tracking/PlansTracking.routes.js";
import traineeChallengeRouter from "./src/modules/Trainee/Home/Challenges/challenge.routes.js";
import traineesleepingTrack from "./src/modules/Trainee/Home/Sleeping Track/sleepTrack.routes.js";
import DietRouter from "./src/modules/Trainee/Diet/Diet.routes.js";
import trainerTraineesRouter from "./src/modules/Trainer/trainee/trainee.routes.js";
import trainerChallengeRouter from "./src/modules/Trainer/Challenges/challenge.routes.js";
import traineeProgressRouter from "./src/modules/Trainee/Progress/progress.routes.js";
import conversationRouter from "./src/modules/Conversation/conversation.routes.js";
import messageRouter from "./src/modules/Message/message.routes.js";
import adminDashboardRoutes from "./src/modules/Admin/Dashboard/Dashboard.routes.js";
const app = express();
const port = 4000;
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("src/uploads"));
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/admin/auth", adminAuthRouter);
app.use("/api/v1/admin/trainers", adminTrainerRouter);
app.use("/api/v1/admin/Dashboard", adminDashboardRoutes);
app.use("/api/v1/trainers/auth", trainerAuthRoutes);
app.use(
  "/api/v1/trainers/ClientTransformations",
  trainerClientTransformationsRoutes
);
app.use(
  "/api/v1/trainers/qualificationAndAchievement",
  qualificationAndAchievementRoutes
);
app.use("/api/v1/trainers/packages", trainerpackagesRoutes);
app.use("/api/v1/trainers/Dashboard", trainerDashboardRoutes);
app.use("/api/v1/trainers", trainerRouter);
app.use("/api/v1/trainers/trainees", trainerTraineesRouter);
app.use("/api/v1/trainers/trainees/challenge", trainerChallengeRouter);
app.use("/api/v1/trainees/auth", tranieeAuthRouter);
app.use("/api/v1/trainees/profile", tranieeProfileRouter);
app.use("/api/v1/trainees", traineeExploreRouter);
app.use("/api/v1/trainees", traineeReviewRouter);
app.use("/api/v1/trainees/heart-rate", tranieeheartRate);
app.use("/api/v1/trainees/steps", tranieeRecordSteps);
app.use("/api/v1/trainees/water", traineeWaterIntake);
app.use("/api/v1/trainees/plansTracking", tranieeplansTracking);
app.use("/api/v1/trainees/challenge", traineeChallengeRouter);
app.use("/api/v1/trainees/progress", traineeProgressRouter);
app.use("/api/v1/trainees/sleeping-track", traineesleepingTrack);
app.use("/api/v1/trainees/subscription", SubscriptionRouter);
app.use("/api/v1/trainees/DietAssessment", DietAssessmentRouter);
app.use("/api/v1/trainees/Diet", DietRouter);
app.use("/api/v1/chat", conversationRouter);
app.use("/api/v1/chat", messageRouter);

//app.use("/api/v1/trainees/subscription", SubscriptionRouter);

app.use("/api/v1/Food", FoodRouter);
app.use("/api/v1/Meal", MealRouter);
app.use("/api/v1/Nutrition", NutritionRouter);
app.all("*", (req, res, next) => {
  next(new AppError("Endpoint was not found", 404));
});

app.use(globalErrorHandling);
//console.log(`Memory Usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);

dbConnection();
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
//node --max-old-space-size=4096 index.js  # Increase to 4 GB, adjust as necessary
