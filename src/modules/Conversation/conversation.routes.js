import { Router } from "express";
const conversationRouter = Router();
import * as conversation from "./conversation.controller.js";
import { verifyToken, allowedTo } from "../../middlewares/authToken.js";

conversationRouter.get(
  "/conversations",
  verifyToken,
  allowedTo("trainer", "trainee"),
  conversation.getAllConversations
);

export default conversationRouter;
