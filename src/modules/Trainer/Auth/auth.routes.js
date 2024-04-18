import { Router } from "express";
const trainerAuthRoutes = Router();
import * as auth from "./auth.controller.js";

trainerAuthRoutes.post("/", auth.signUp);
trainerAuthRoutes.post("/SignIn", auth.SignIn);
export default trainerAuthRoutes;
