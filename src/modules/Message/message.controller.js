import { conversationModel } from "../../../Database/models/conversation.model.js";
import { messageModel } from "../../../Database/models/message.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";

// Fetch all messages in a conversation
const getMessages = catchAsyncError(async (req, res, next) => {
  const { conversationId } = req.params;

  const messages = await messageModel
    .find({ conversationId })
    .populate("sender", "firstName lastName email");

  if (!messages.length) {
    return next(new AppError("No messages found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Messages retrieved successfully",
    data: messages,
  });
});

// Send a message in a conversation
const sendMessage = catchAsyncError(async (req, res, next) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;
  const senderModel = req.user.role;

  // Find the conversation to get receiver info
  const conversation = await conversationModel.findById(conversationId);
  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  const receiver = conversation.participants.find(
    (participant) => participant.participantId.toString() !== senderId
  );
  const receiverId = receiver.participantId;
  const receiverModel = receiver.participantModel;

  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    const folderName = `Messages/${conversationId}`;
    for (const file of req.files) {
      const uploadResult = await uploadImageToCloudinary(file, folderName);
      if (uploadResult) {
        imageUrls.push(uploadResult.url);
      }
    }
  }

  const message = new messageModel({
    conversationId,
    sender: senderId,
    senderModel,
    receiver: receiverId,
    receiverModel,
    content,
    images: imageUrls,
  });

  const savedMessage = await message.save();

  // Update the conversation with the last message and time
  conversation.lastMessage = savedMessage._id;
  conversation.lastMessageTime = savedMessage.createdAt;
  await conversation.save();

  res.status(200).json({ success: true, data: savedMessage });
});

export { getMessages, sendMessage };
