import { Router } from "express";
const trainerClientTransformationsRoutes = Router();
import * as ClientTransformations from "./ClientTransformations.controller.js";
import { uploadMixOfFiles } from "../../../multer/multer.js";
import { verifyToken, allowedTo } from "../../../middlewares/authToken.js";

let arrFields = [
  { name: "profilePhoto", maxCount: 1 },
  { name: "nationalId", maxCount: 2 },
  { name: "qualificationsAndAchievements", maxCount: 10 },
  { name: "beforeImage", maxCount: 10 },
  { name: "afterImage", maxCount: 10 },
];

trainerClientTransformationsRoutes.post(
  "/",
  verifyToken,
  allowedTo("trainer"),
  uploadMixOfFiles(arrFields),
  ClientTransformations.addClientTransformations
);
trainerClientTransformationsRoutes.get(
  "/",
  verifyToken,
  allowedTo("trainer"),
  ClientTransformations.getClientTransformations
);
trainerClientTransformationsRoutes.get(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  ClientTransformations.getspecificClientTransformations
);
trainerClientTransformationsRoutes.patch(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  uploadMixOfFiles(arrFields),
  ClientTransformations.updateClientTransformation
);
trainerClientTransformationsRoutes.delete(
  "/:id",
  verifyToken,
  allowedTo("trainer"),
  ClientTransformations.deleteClientTransformation
);

export default trainerClientTransformationsRoutes;
