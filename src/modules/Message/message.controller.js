import { conversationModel } from "../../../Database/models/conversation.model.js";
import { messageModel } from "../../../Database/models/message.model.js";
import { io } from "../../../Socket/socket.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";

// Fetch all messages in a conversation
const getMessages = catchAsyncError(async (req, res, next) => {
  const { conversationId } = req.params;
  const  userId  = req.user.payload.id; 

  const messages = await messageModel
    .find({ conversationId })
    .populate("sender", "firstName lastName email profilePhoto");

    console.log(userId);
  // Instead of returning an error, just prepare an empty array if no messages are found
  const formattedMessages = messages.length > 0 ? messages.map(message => ({
    _id: message._id,
    content: message.content,
    images: message.images,
    sender: {
      _id: message.sender._id,
      firstName: message.sender.firstName,
      lastName: message.sender.lastName,
      email: message.sender.email,
      profilePhoto: message.sender.profilePhoto || "defaultProfilePhotoUrl",
    },
    userId: userId,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  })) : [];

  res.status(200).json({
    success: true,
    message: "Messages retrieved successfully",
    data: formattedMessages,
  });
});
// Send a message in a conversation
const sendMessage = catchAsyncError(async (req, res, next) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const senderId = req.user.payload.id;
  let senderModel = req.user.payload.role.charAt(0).toUpperCase() + req.user.payload.role.slice(1);

  const conversation = await conversationModel.findById(conversationId);
  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  const receiver = conversation.participants.find(participant => participant.participantId.toString() !== senderId);
  if (!receiver) {
    return next(new AppError("Receiver not found", 404));
  }
  let receiverId = receiver.participantId;
  let receiverModel = receiver.participantModel.charAt(0).toUpperCase() + receiver.participantModel.slice(1);

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

  conversation.lastMessage = savedMessage._id;
  conversation.lastMessageTime = savedMessage.createdAt;
  await conversation.save();

  io.to(receiverId).emit('newMessage', {
    id: savedMessage._id,
    conversationId,
    sender: {
      id: senderId,
      model: senderModel
    },
    receiver: {
      id: receiverId,
      model: receiverModel
    },
    content,
    images: imageUrls,
    createdAt: savedMessage.createdAt,
    updatedAt: savedMessage.updatedAt
  });
  console.log(`Message sent to conversation ${conversationId}`);
  res.status(200).json({ success: true, data: savedMessage });
});
export { getMessages, sendMessage };
