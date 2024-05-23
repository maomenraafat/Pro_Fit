import express from 'express';
import * as challenge from './challenge.controller.js';
import { allowedTo, verifyToken } from '../../../middlewares/authToken.js'
import { uploadChallengeImage } from '../../../multer/multer.js';

const trainerChallengeRouter = express.Router();

trainerChallengeRouter.post('/:id', verifyToken, allowedTo('trainer'), uploadChallengeImage(), challenge.addChallengeForTraineeByTrainer);
trainerChallengeRouter.patch('/:id/:challengeId', verifyToken, allowedTo('trainer'), uploadChallengeImage(), challenge.updateChallengeForTraineeByTrainer);
trainerChallengeRouter.delete('/:id/:challengeId', verifyToken, allowedTo('trainer'), challenge.deleteChallengeForTraineeByTrainer);
trainerChallengeRouter.get('/:id', verifyToken, allowedTo('trainer'), challenge.getChallengesForTraineeByTrainer);

export default trainerChallengeRouter;
