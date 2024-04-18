import { Router } from "express";
const trainerpackagesRoutes = Router();
import * as Package from "./Package.controller.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";

trainerpackagesRoutes.post(
  "/",
  verifyToken,
  allowedTo("trainer"),
  Package.addPackage
);
trainerpackagesRoutes.get(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  Package.getSpecificPackage
);
trainerpackagesRoutes.get(
  "/",
  verifyToken,
  allowedTo("trainer"),
  Package.getTrainerpackages
);
trainerpackagesRoutes.patch(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  Package.updatePackage
);
trainerpackagesRoutes.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  Package.deletePackage
);

export default trainerpackagesRoutes;
