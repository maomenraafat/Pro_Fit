import { traineeModel } from "../../../Database/models/Trainee.model.js";
import { trainerModel } from "../../../Database/models/Trainer.model.js";
import { conversationModel } from "../../../Database/models/conversation.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";


const getAllConversations = catchAsyncError(async (req, res, next) => {
  const userId = req.user.payload.id;
  const userRole = req.user.payload.role;

  // Fetch conversations involving the authenticated user
  const conversations = await conversationModel.find({
    "participants.participantId": userId,
    "participants.participantModel": userRole === "trainer" ? "Trainer" : "Trainee",
  }).populate({
    path: "lastMessage",
    select: "content createdAt",
  });

  if (!conversations.length) {
    return next(new AppError("No conversations found", 404));
  }

  // Manually populate the participants
  const populatedConversations = await Promise.all(conversations.map(async conversation => {
    const populatedParticipants = await Promise.all(conversation.participants.map(async participant => {
      const model = participant.participantModel === "Trainer" ? trainerModel : traineeModel;
      const populatedParticipant = await model.findById(participant.participantId).select("firstName lastName profilePhoto email");
      return {
        participantId: populatedParticipant,
        participantModel: participant.participantModel
      };
    }));
    conversation.participants = populatedParticipants;
    return conversation;
  }));

  // Format the response data to match the UI
  const formattedConversations = populatedConversations.map(conversation => {
    const lastMessageContent = conversation.lastMessage ? conversation.lastMessage.content : "No messages yet";
    const lastMessageTime = conversation.lastMessage ? conversation.lastMessage.createdAt : "";

    const participant = conversation.participants.find(p => p.participantId && p.participantId._id.toString() !== userId);
    const participantInfo = participant ? participant.participantId : null;

    return {
      _id: conversation._id,
      participant: participantInfo ? {
        _id: participantInfo._id,
        firstName: participantInfo.firstName || "Unknown",
        lastName: participantInfo.lastName || "Unknown",
        profilePhoto: participantInfo.profilePhoto || "defaultProfilePhotoUrl",
        email: participantInfo.email || "unknown@example.com",
      } : null,
      lastMessage: {
        content: lastMessageContent,
        createdAt: lastMessageTime
      }
    };
  }).filter(conversation => conversation.participant !== null);

  res.status(200).json({
    success: true,
    message: "Conversations retrieved successfully",
    data: formattedConversations,
  });
});

export {
    getAllConversations,
};
