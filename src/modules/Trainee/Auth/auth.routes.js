import { Router } from "express";
const tranieeAuthRouter = Router();
import * as auth from "./auth.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";

tranieeAuthRouter.post("/signup", auth.tranieeSignUp);
tranieeAuthRouter.post("/verify-otp", auth.verifyTraineeOTP); 
tranieeAuthRouter.post("/resend-otp", auth.resendOTP);
tranieeAuthRouter.post("/basic-info",verifyToken,allowedTo("trainee"),auth.basicInformation);
tranieeAuthRouter.post("/forget-password", auth.forgetPassword);
tranieeAuthRouter.post("/reset-password", auth.resetPassword);
tranieeAuthRouter.post("/signin", auth.traineeSignIn);

export default tranieeAuthRouter;
