import express from 'express';
import * as challenge from './challenge.controller.js';
import { allowedTo, verifyToken } from '../../../middlewares/authToken.js'
import { uploadChallengeImage } from '../../../multer/multer.js';

const trainerChallengeRouter = express.Router();

trainerChallengeRouter.post('/:traineeId', verifyToken, allowedTo('trainer'), uploadChallengeImage(), challenge.addChallengeForTraineeByTrainer);
trainerChallengeRouter.patch('/:traineeId/:challengeId', verifyToken, allowedTo('trainer'), uploadChallengeImage(), challenge.updateChallengeForTraineeByTrainer);
trainerChallengeRouter.delete('/:traineeId/:challengeId', verifyToken, allowedTo('trainer'), challenge.deleteChallengeForTraineeByTrainer);
trainerChallengeRouter.get('/:traineeId', verifyToken, allowedTo('trainer'), challenge.getChallengesForTraineeByTrainer);

export default trainerChallengeRouter;
