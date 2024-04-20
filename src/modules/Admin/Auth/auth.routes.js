import { Router } from "express";
const adminAuthRouter = Router();
import * as auth from "../../Admin/Auth/auth.controller.js";
import { verifyToken } from "../../../middlewares/authToken.js";
import { uploadMixOfFiles } from "../../../multer/multer.js";

adminAuthRouter.post("/", auth.SignUp);
adminAuthRouter.post("/signIn", auth.signIn);
adminAuthRouter.post("/", verifyToken, auth.logoutAdmin);

export default adminAuthRouter;
