import { Router } from "express";
const adminAuthRouter = Router();
import * as auth from "../../Admin/Auth/auth.controller.js";
import { verifyToken } from "../../../middlewares/authToken.js";
import { uploadMixOfFiles } from "../../../multer/multer.js";

// let arrFields = [{ name: "profilePhoto", maxCount: 1 }];
adminAuthRouter.post("/", auth.SignUp);
adminAuthRouter.post("/signIn", auth.signIn);
adminAuthRouter.post("/", verifyToken, auth.logoutAdmin);

export default adminAuthRouter;
