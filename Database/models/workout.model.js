import { Schema, model } from "mongoose";

const workoutSchema = new Schema(
  {
    planName: {
      type: String,
      required: [false, "Plan Name is required"],
    },
    trainer: {
      type: Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    trainee: {
      type: Schema.Types.ObjectId,
      ref: "Trainee",
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    duration: {
      type: Number,
      required: true,
    },
    weeks: [
      {
        dayNumber: {
          type: Number,
          required: false,
        },
        sections: [
          {
            type: Schema.Types.ObjectId,
            ref: "section",
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const WorkoutModel = model("workout", workoutSchema);
