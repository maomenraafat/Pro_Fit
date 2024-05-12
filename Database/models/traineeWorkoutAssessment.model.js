import { Schema, model } from "mongoose";

const traineeWorkoutAssessmentSchema = new Schema(
  {
    trainee: {
      type: Schema.ObjectId,
      ref: "Trainee",
      required: true,
    },
    experience: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
    workoutDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    availableTools: {
      type: [String],
      enum: [
        "Dumbbells",
        "Barbells",
        "Resistance Bands",
        "Kettlebells",
        "None",
        "Other",
      ],
    },
    injuries: {
      type: String,
      default: "None",
    },
    targetMuscle: {
      type: [String],
      enum: ["Chest", "Back", "Legs", "Arms", "Shoulders", "Core", "Full Body"],
    },
    sports: {
      type: [String],
      default: [],
    },
    workoutLocation: {
      type: String,
      enum: ["Home", "Gym", "Outdoor", "Mixed"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Current", "Archived"],
      default: "Current",
    },
  },
  {
    timestamps: true,
  }
);

export const traineeWorkoutAssessmentModel = model(
  "traineeWorkoutAssessment",
  traineeWorkoutAssessmentSchema
);
