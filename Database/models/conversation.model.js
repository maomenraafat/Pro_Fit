import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: [
      {
        participantId: {
          type: Schema.ObjectId,
          refPath: "participantModel",
          required: true,
        },
        participantModel: {
          type: String,
          required: true,
          enum: ["Trainee", "Trainer"],
        },
      },
    ],
    lastMessage: {
      type: Schema.ObjectId,
      ref: "Message",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const conversationModel = model("Conversation", conversationSchema);
