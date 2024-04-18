import { Router } from "express";
const trainerRoutes = Router();
import * as Trainer from "./Trainer.controller.js";
import { uploadMixOfFiles } from "../../multer/multer.js";
import { verifyToken, allowedTo } from "../../middlewares/authToken.js";

let arrFields = [
  { name: "profilePhoto", maxCount: 1 },
  { name: "beforeImage", maxCount: 10 },
  { name: "afterImage", maxCount: 10 },
];

trainerRoutes.patch(
  "/profile_1",
  verifyToken,
  allowedTo("trainer"),
  uploadMixOfFiles(arrFields),
  Trainer.updatePersonalInfo
);
trainerRoutes.get(
  "/TrainerInfo",
  verifyToken,
  allowedTo("trainer"),
  Trainer.getTrainerInfo
);
trainerRoutes.patch(
  "/profile_2",
  verifyToken,
  allowedTo("trainer"),
  uploadMixOfFiles(arrFields),
  Trainer.updateProfessionalCredentials
);
trainerRoutes.get(
  "/ProfessionalCredentials",
  verifyToken,
  allowedTo("trainer"),
  Trainer.getProfessionalCredentials
);
trainerRoutes.patch(
  "/submitionrequests",
  verifyToken,
  allowedTo("trainer"),
  Trainer.submitionrequests
);
trainerRoutes.get(
  "/trainer_Data",
  verifyToken,
  allowedTo("trainer"),
  Trainer.getTrainerData
);
trainerRoutes.get(
  "/trainer_about",
  verifyToken,
  allowedTo("trainer"),
  Trainer.getTrainerAbout
);
trainerRoutes.patch(
  "/update_trainer_about",
  verifyToken,
  allowedTo("trainer"),
  Trainer.updateTrainerAbout
);

export default trainerRoutes;
