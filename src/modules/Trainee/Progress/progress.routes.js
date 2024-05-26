import { Router } from "express";
const traineeProgressRouter = Router();
import * as progress from "./progress.controller.js";
import { allowedTo, verifyToken } from "../../../middlewares/authToken.js";
import { uploadProgressImage } from "../../../multer/multer.js";

// POST endpoint to add progress with photo
traineeProgressRouter.post('/photo', verifyToken, allowedTo('trainee'), uploadProgressImage(), progress.addProgressPhoto);

// GET endpoint to retrieve progress entries
traineeProgressRouter.get('/photo', verifyToken, allowedTo('trainee'), progress.getProgressPhoto);

// DELETE endpoint to delete a specific progress entry
traineeProgressRouter.delete('/photo/:progressId', verifyToken, allowedTo('trainee'), progress.deleteProgressPhoto);

// GET endpoint to retrieve diet assessment measurements
traineeProgressRouter.get('/measurements', verifyToken, allowedTo('trainee'), progress.getDietAssessmentMeasurements);

export default traineeProgressRouter;