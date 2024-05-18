import { Router } from "express";
const SubscriptionRouter = Router();
import * as Subscription from "./subscription.controller.js";
import {
  allowedTo,
  verifyToken,
  checkIfAlreadySubscribed,
} from "../../../middlewares/authToken.js";

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
  checkIfAlreadySubscribed,
  Subscription.selectPackage
);
SubscriptionRouter.post(
  "/subscribe/:id",
  verifyToken,
  allowedTo("trainee"),
  checkIfAlreadySubscribed,
  Subscription.subscribeWithTrainer
);

export default SubscriptionRouter;
