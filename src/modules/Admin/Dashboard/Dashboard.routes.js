import { Router } from "express";
const adminDashboardRoutes = Router();
import * as Dashboard from "./Dashboard.controller.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";

adminDashboardRoutes.get(
  "/performanceMetrics",
  verifyToken,
  allowedTo("admin"),
  Dashboard.performanceMetrics
);
adminDashboardRoutes.get(
  "/getDashboardData",
  verifyToken,
  allowedTo("admin"),
  Dashboard.getDashboardData
);
adminDashboardRoutes.get(
  "/getSubscriptionsByStartDate",
  verifyToken,
  allowedTo("admin"),
  Dashboard.getSubscriptionsByStartDate
);
adminDashboardRoutes.get(
  "/getTotalSystemUsers",
  verifyToken,
  allowedTo("admin"),
  Dashboard.getTotalSystemUsers
);
adminDashboardRoutes.get(
  "/getTrainerStatusCounts",
  verifyToken,
  allowedTo("admin"),
  Dashboard.getTrainerStatusCounts
);
adminDashboardRoutes.get(
  "/getTraineeStatusCounts",
  verifyToken,
  allowedTo("admin"),
  Dashboard.getTraineeStatusCounts
);

export default adminDashboardRoutes;
