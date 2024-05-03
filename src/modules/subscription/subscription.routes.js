import { Router } from "express";
const SubscriptionRouter = Router();
import * as Subscription from "./subscription.controller.js";
import { allowedTo, verifyToken } from "../../middlewares/authToken.js";

SubscriptionRouter.get(
  "/getPackages/:id",
  verifyToken,
  allowedTo("trainee"),
  Subscription.getTrainerpackages
);
SubscriptionRouter.get(
  "/subscriptionDetails",
  verifyToken,
  allowedTo("trainee"),
  Subscription.getTrainerAndPackageDetails
);
SubscriptionRouter.patch(
  "/selectPackage/:id",
  verifyToken,
  allowedTo("trainee"),
  Subscription.selectPackage
);
SubscriptionRouter.post(
  "/subscribe/:id",
  verifyToken,
  allowedTo("trainee"),
  Subscription.subscribeWithTrainer
);

export default SubscriptionRouter;
