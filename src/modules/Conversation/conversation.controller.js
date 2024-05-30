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
  }).populate("participants.participantId", "firstName lastName email")
    .populate("lastMessage");

  if (!conversations.length) {
    return next(new AppError("No conversations found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Conversations retrieved successfully",
    data: conversations,
  });
});



export {
    getAllConversations,
    
};
