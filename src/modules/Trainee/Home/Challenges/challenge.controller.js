import { Challenge } from "../../../../../Database/models/Challenge.model.js";
import { catchAsyncError } from "../../../../utils/catchAsyncError.js";
import { uploadImageToCloudinary } from "../../../../utils/cloudinary.js";
import formatDuration from "../../../../utils/formatDuration.js";

// Function to add a new challenge
const addChallenge = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const { title } = req.body;

  // Check if a challenge with the same title already exists for this trainee
  const existingChallenge = await Challenge.findOne({
    trainee: traineeId,
    title: title,
  });

  if (existingChallenge) {
    return res.status(409).json({
      success: false,
      message: "You already have a challenge with this title. Please choose a different title.",
    });
  }

  let imageUrl = null;

  // Check if the file is uploaded
  if (req.file) {
    const folderName = `Challenges/${traineeId}`;
    const uploadResult = await uploadImageToCloudinary(req.file, folderName);
    if (uploadResult && uploadResult.url) {
      imageUrl = uploadResult.url; 
    }
  }

  // Create the new challenge if no existing title is found
  const newChallenge = await Challenge.create({
    trainee: traineeId,
    createdBy: traineeId,  // Save the creator ID
    title: title,
    image: imageUrl,
  });

  res.status(201).json({
    success: true,
    message: "Challenge added successfully.",
    data: { _id: newChallenge._id },
  });
});


// Function to give up/restart a challenge
const toggleChallengeStatus = catchAsyncError(async (req, res) => {
  const { challengeId } = req.params;
  const traineeId = req.user.payload.id;

  // Retrieve the challenge with the given ID that belongs to the trainee
  const challenge = await Challenge.findOne({
    _id: challengeId,
    trainee: traineeId,
  });

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message:
        "Challenge not found or you do not have permission to access this challenge.",
    });
  }

  // Determine whether to give up or restart based on the presence of an endTime
  if (!challenge.endTime) {
    // No endTime means the challenge is active; we need to give it up
    const endTime = new Date();
    const timeElapsed =
      (endTime.getTime() - challenge.startTime.getTime()) / 1000;

    const updatedChallenge = await Challenge.findByIdAndUpdate(
      challengeId,
      { endTime: endTime, finalTimeElapsed: timeElapsed },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully gave up on challenge.",
      data: {
        // ...updatedChallenge.toObject(),
        _id: updatedChallenge._id,
        formattedTimeElapsed: "00 d : 00 h : 00 m : 00 s",
      },
    });
  } else {
    // endTime is present, so the challenge has been given up; we need to restart it
    await Challenge.findByIdAndUpdate(
      challengeId,
      {
        startTime: new Date(),
        endTime: null,
        $inc: { timeElapsed: challenge.finalTimeElapsed },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Challenge restarted successfully.",
    });
  }
});

// Function to update an existing challenge
const updateChallenge = catchAsyncError(async (req, res) => {
  const { challengeId } = req.params; // Get challenge ID from URL parameters
  const traineeId = req.user.payload.id; // Assuming the user's ID is in the payload of the request
  const updates = req.body; // Collect all updates from the request body

  console.log(updates);

  // Check if the file is uploaded and update the image URL
  if (req.file) {
    const folderName = `Challenges/${traineeId}`;
    const uploadResult = await uploadImageToCloudinary(req.file, folderName);
    if (uploadResult && uploadResult.url) {
      updates.image = uploadResult.url; // Update the image URL if a new file is uploaded
    }
  }

  // Find the challenge by ID and ensure it belongs to the trainee
  const challenge = await Challenge.findOne({
    _id: challengeId,
    trainee: traineeId,
  });

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message:
        "Challenge not found or you do not have permission to update this challenge.",
    });
  }

  // Update the challenge with new values
  const updatedChallenge = await Challenge.findByIdAndUpdate(
    challengeId,
    updates,
    { new: true, runValidators: true } // Return the updated object and run validators
  );

  res.status(200).json({
    success: true,
    message: "Challenge updated successfully.",
    data: updatedChallenge,
  });
});

// Delete a challenge
const deleteChallenge = catchAsyncError(async (req, res) => {
  const { challengeId } = req.params;
  const traineeId = req.user.payload.id;

  const challenge = await Challenge.findOneAndDelete({
    _id: challengeId,
    trainee: traineeId,
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

// Retrieve all challenges for a trainee
const getChallenges = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const challenges = await Challenge.find({ trainee: traineeId });
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
  addChallenge,
  toggleChallengeStatus,
  updateChallenge,
  deleteChallenge,
  getChallenges,
};
