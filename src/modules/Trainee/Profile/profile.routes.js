import { Router } from "express";
const tranieeProfileRouter = Router();
import * as profile from "./profile.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";


import multer from "multer";

const upload = multer();  



tranieeProfileRouter.get(
  "/",
  verifyToken,
  allowedTo("trainee"),
  profile.profileSettings
);

tranieeProfileRouter.get(
  "/account-data",
  verifyToken,
  allowedTo("trainee"),
  profile.getAccountData
);

tranieeProfileRouter.patch(
  "/account-data",
  verifyToken,
  allowedTo("trainee"),
  upload.fields([{ name: 'profilePhoto', maxCount: 1 }]),
  profile.updateAccountData
);

tranieeProfileRouter.get(
  "/personal-data",
  verifyToken,
  allowedTo("trainee"),
  profile.getPersonalData
);

tranieeProfileRouter.patch(
  "/personal-data",
  verifyToken,
  allowedTo("trainee"),
  profile.updatePersonalData
);

tranieeProfileRouter.post(
  "/change-password",
  verifyToken,
  allowedTo("trainee"),
  profile.changePassword
);

tranieeProfileRouter.delete(
  "/delete-account",
  verifyToken,
  allowedTo("trainee"),
  profile.deleteAccount
);

export default tranieeProfileRouter;
