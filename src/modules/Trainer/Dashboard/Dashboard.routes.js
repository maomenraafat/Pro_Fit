import { Router } from "express";
const trainerDashboardRoutes = Router();
import * as Dashboard from "./Dashboard.controller.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";

trainerDashboardRoutes.get(
  "/performanceMetrics",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.performanceMetrics
);
trainerDashboardRoutes.get(
  "/getDashboardData",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getDashboardData
);
trainerDashboardRoutes.get(
  "/getActiveReadyAssessmentTraineesDashboard",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getActiveReadyAssessmentTraineesDashboard
);

trainerDashboardRoutes.get(
  "/getSubscriptionsDashboard",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getSubscriptionsDashboard
);
trainerDashboardRoutes.get(
  "/getTraineesDashboard",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getTraineesDashboard
);
trainerDashboardRoutes.get(
  "/packages",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getTrainerPackagesDashboard
);
trainerDashboardRoutes.get(
  "/subscriptionsDate",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getAllSubscriptionsDateForTrainer
);

trainerDashboardRoutes.get(
  "/subscriptions-by-date",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getSubscriptionsByStartDate
);

// trainerDashboardRoutes.get(
//   "/getActiveReadyDietTraineesDashboard",
//   verifyToken,
//   allowedTo("trainer"),
//   Dashboard.getActiveReadyDietTraineesDashboard
// );

trainerDashboardRoutes.get(
  "/getAverageRating",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getAverageRating
);

trainerDashboardRoutes.get(
  "/diet-plan-ratings",
  verifyToken,
  allowedTo("trainer"),
  Dashboard.getDietPlanRatings
);
export default trainerDashboardRoutes;
