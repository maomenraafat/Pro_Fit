import { catchAsyncError } from "./../../../utils/catchAsyncError.js";
import { Challenge } from "./../../../../Database/models/Challenge.model.js";
import { traineeModel } from "./../../../../Database/models/Trainee.model.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";
import formatDuration from "../../../utils/formatDuration.js";

const addChallengeForTraineeByTrainer = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.payload.id;
  const { title } = req.body;

  // Check if the trainee has an assigned trainer
  const trainee = await traineeModel.findById(id);
  if (!trainee || trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to add a challenge for this trainee.",
    });
  }

  // Check if a challenge with the same title already exists for this trainee
  const existingChallenge = await Challenge.findOne({
    trainee: id,
    title: title,
  });

  if (existingChallenge) {
    return res.status(409).json({
      success: false,
      message:
        "This trainee already has a challenge with this title. Please choose a different title.",
    });
  }

  let imageUrl = null;

  // Check if the file is uploaded
  if (req.file && req.file.path) {
    const folderName = `Challenges/${id}`;
    try {
      const uploadResult = await uploadImageToCloudinary(req.file.path, folderName);
      if (uploadResult && uploadResult.url) {
        imageUrl = uploadResult.url; // Capture the URL from Cloudinary upload
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image to Cloudinary.",
      });
    }
  }

  // Create the new challenge if no existing title is found
  const newChallenge = await Challenge.create({
    trainee: id,
    trainer: trainerId, // Save the trainer ID
    createdBy: trainerId, // Save the creator ID
    title: title,
    image: imageUrl,
  });

  res.status(201).json({
    success: true,
    message: "Challenge added successfully.",
    data: { _id: newChallenge._id },
  });
});

const updateChallengeForTraineeByTrainer = catchAsyncError(async (req, res) => {
  const { id, challengeId } = req.params;
  const trainerId = req.user.payload.id;
  const updates = req.body;

  // Check if the trainee has an assigned trainer
  const trainee = await traineeModel.findById(id);
  if (!trainee || trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update a challenge for this trainee.",
    });
  }

  // Find the challenge by ID and ensure it belongs to the trainee
  const challenge = await Challenge.findOne({
    _id: challengeId,
    trainee: id,
  });

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message:
        "Challenge not found or you do not have permission to update this challenge.",
    });
  }

  // Check if the file is uploaded and update the image URL
  if (req.file) {
    const folderName = `Challenges/${id}`;
    const uploadResult = await uploadImageToCloudinary(req.file, folderName);
    if (uploadResult && uploadResult.url) {
      updates.image = uploadResult.url;
    }
  }

  // Update the challenge with new values
  const updatedChallenge = await Challenge.findByIdAndUpdate(
    challengeId,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Challenge updated successfully.",
    data: updatedChallenge,
  });
});

const deleteChallengeForTraineeByTrainer = catchAsyncError(async (req, res) => {
  const { id, challengeId } = req.params;
  const trainerId = req.user.payload.id;

  // Check if the trainee has an assigned trainer
  const trainee = await traineeModel.findById(id);
  if (!trainee || trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete a challenge for this trainee.",
    });
  }

  // Find and delete the challenge
  const challenge = await Challenge.findOneAndDelete({
    _id: challengeId,
    trainee: id,
  });

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message:
        "Challenge not found or you do not have permission to delete this challenge.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Challenge deleted successfully.",
  });
});

const getChallengesForTraineeByTrainer = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.payload.id;

  // Check if the trainee has an assigned trainer
  const trainee = await traineeModel.findById(id);
  if (!trainee || trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view challenges for this trainee.",
    });
  }

  // Find challenges for the trainee created by the trainer
  const challenges = await Challenge.find({
    trainee: id,
    createdBy: trainerId,
  });
  const currentTime = new Date();

  const formattedChallenges = challenges.map((challenge) => {
    let formattedTimeElapsed;
    if (challenge.endTime) {
      // Show zeroed time if given up
      formattedTimeElapsed = "00 d : 00 h : 00 m : 00 s";
    } else {
      // Calculate ongoing time
      const additionalTime =
        (currentTime.getTime() - challenge.startTime.getTime()) / 1000;
      formattedTimeElapsed = formatDuration(
        challenge.timeElapsed + additionalTime
      );
    }

    // Return only the specified fields
    return {
      _id: challenge._id,
      title: challenge.title,
      image: challenge.image,
      formattedTimeElapsed,
    };
  });

  res.status(200).json({
    success: true,
    message: "Challenges retrieved successfully.",
    data: formattedChallenges,
  });
});

export {
  addChallengeForTraineeByTrainer,
  updateChallengeForTraineeByTrainer,
  deleteChallengeForTraineeByTrainer,
  getChallengesForTraineeByTrainer,
};
