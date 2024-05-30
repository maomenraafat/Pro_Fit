import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.ObjectId,
      refPath: "senderModel",
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Trainee", "Trainer"],
    },
    receiver: {
      type: Schema.ObjectId,
      refPath: "receiverModel",
      required: true,
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["Trainee", "Trainer"],
    },
    content: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export const messageModel = model("Message", messageSchema);
