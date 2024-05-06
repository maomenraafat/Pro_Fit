import express from 'express';
import * as challenge from './challenge.controller.js';
import { allowedTo, verifyToken } from '../../../../middlewares/authToken.js';
import { uploadChallengeImage } from '../../../../multer/multer.js';


const traineeChallengeRouter = express.Router();

traineeChallengeRouter.post('/',verifyToken,allowedTo('trainee'),uploadChallengeImage(),challenge.addChallenge);
traineeChallengeRouter.post('/giveup/:challengeId', verifyToken, allowedTo('trainee'), challenge.toggleChallengeStatus);
traineeChallengeRouter.patch('/:challengeId', verifyToken, allowedTo('trainee'), uploadChallengeImage(),challenge.updateChallenge);
traineeChallengeRouter.delete('/:challengeId', verifyToken, allowedTo('trainee'), challenge.deleteChallenge);
traineeChallengeRouter.get('/', verifyToken, allowedTo('trainee'), challenge.getChallenges);

export default traineeChallengeRouter;