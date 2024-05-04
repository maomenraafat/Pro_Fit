import { Router } from "express";
const adminRouter = Router();
import * as admin from "../Admin/admin.controller.js";
import { verifyToken, allowedTo } from "../../middlewares/authToken.js";
import { uploadMixOfFiles } from "../../multer/multer.js";

let arrFields = [{ name: "profilePhoto", maxCount: 1 }];

adminRouter.patch(
  "/updatePersonalInfo",
  verifyToken,
  allowedTo("admin"),
  uploadMixOfFiles(arrFields),
  admin.updatePersonalInfo
);
adminRouter.get(
  "/PersonalInfo",
  verifyToken,
  allowedTo("admin"),
  admin.getAdminInfo
);
adminRouter.get(
  "/SystemUsers",
  verifyToken,
  allowedTo("admin"),
  admin.getSystemUsers
);
export default adminRouter;
