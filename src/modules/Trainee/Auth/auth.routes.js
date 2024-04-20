import { Router } from "express";
const tranieeAuthRouter = Router();
import * as auth from "./auth.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

tranieeAuthRouter.post("/SignUp", auth.tranieeSignUp);
tranieeAuthRouter.post("/verifyOTP", auth.verifyTraineeOTP); //it takes 10 min to expire
tranieeAuthRouter.post("/resendOTP", auth.resendOTP);
tranieeAuthRouter.post("/forgetPassword", auth.forgetPassword);
tranieeAuthRouter.post("/resetPassword", auth.resetPassword);
tranieeAuthRouter.post("/SignIn", auth.traineeSignIn);
tranieeAuthRouter.post(
  "/changePassword",
  verifyToken,
  allowedTo("trainee"),
  auth.changePassword
);
tranieeAuthRouter.delete(
  "/deleteAccount",
  verifyToken,
  allowedTo("trainee"),
  auth.deleteAccount
);

export default tranieeAuthRouter;
