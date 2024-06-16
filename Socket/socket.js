import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { verifyTokenSocket } from '../src/middlewares/authToken.js';
import { conversationModel } from '../Database/models/conversation.model.js';
import { messageModel } from '../Database/models/message.model.js';
import { uploadImageToCloudinary } from '../src/utils/cloudinary.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware to verify the JWT in WebSocket connections
io.use(verifyTokenSocket);

io.on('connection', (socket) => {
  console.log('Authenticated user connected:', socket.user.id);

  // Join the user to a room specific to their user ID
  socket.join(socket.user.id);

  socket.on('message', async (data) => {
    try {
      const { conversationId, content, images } = data;
      const senderId = socket.user.id;
      let imageUrls = [];

      // Handle image uploads
      if (images && images.length > 0) {
        const folderName = `Messages/${conversationId}`;
        for (const image of images) {
          const buffer = Buffer.from(image, 'base64');
          const uploadResult = await uploadImageToCloudinary(buffer, folderName);
          if (uploadResult) {
            imageUrls.push(uploadResult.url);
          }
        }
      }

      // Find the conversation to get receiver info
      const conversation = await conversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Assuming there are only two participants in each conversation
      const receiver = conversation.participants.find(participant => participant.participantId.toString() !== senderId);
      if (!receiver) {
        throw new Error('Receiver not found');
      }
      let receiverId = receiver.participantId;
      let receiverModel = receiver.participantModel.charAt(0).toUpperCase() + receiver.participantModel.slice(1);
      let senderModel = socket.user.role.charAt(0).toUpperCase() + socket.user.role.slice(1);

      // Save the message to the database
      const message = new messageModel({
        conversationId,
        sender: senderId,
        senderModel: senderModel,
        receiver: receiverId,
        receiverModel: receiverModel,
        content,
        images: imageUrls,
      });

      const savedMessage = await message.save();

      // Update the conversation with the last message and time
      conversation.lastMessage = savedMessage._id;
      conversation.lastMessageTime = savedMessage.createdAt;
      await conversation.save();

      // Emit the message to the receiver's room
      io.to(receiverId.toString()).emit('newMessage', {
        _id: savedMessage._id,
        conversationId,
        sender: {
            _id: senderId
          },
        content,
        images: imageUrls,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt
      });

      console.log(`Message sent to conversation ${conversationId}`);
    } catch (error) {
      console.error('Error handling message event:', error);
    }
  });

  socket.on('fetchMessages', async (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.user.id;

      const messages = await messageModel
        .find({ conversationId })
        .populate("sender", "firstName lastName email profilePhoto");

      const formattedMessages = messages.map(message => ({
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
      }));

      socket.emit('previousMessages', formattedMessages);

      console.log(`Messages fetched for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
  });
});

export { app, server, io };
