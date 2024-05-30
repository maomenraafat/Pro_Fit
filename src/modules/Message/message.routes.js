import { Router } from "express";
const messageRouter = Router();
import * as message from "./message.controller.js";
import { verifyToken, allowedTo } from "../../middlewares/authToken.js";
import { uploadMessageImages } from "../../multer/multer.js";

// Routes for fetching messages in a conversation
messageRouter.get(
  "/conversations/:conversationId/messages",
  verifyToken,
  allowedTo("trainer", "trainee"),
  message.getMessages
);

// Routes for sending a message
messageRouter.post(
    "/conversations/:conversationId/messages",
    verifyToken,
    allowedTo("trainer", "trainee"),
    uploadMessageImages(),
    message.sendMessage
  );
  

export default messageRouter;
