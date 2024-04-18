import mongoose from "mongoose";
const { Schema, model } = mongoose;

const packageSchema = new Schema({
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: "Trainer",
    required: true,
  },
  traineeIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "Trainee",
    },
  ],
  packageName: {
    type: String,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Package Name is required.",
    ],
  },
  packageType: {
    type: String,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Package type is required.",
    ],
    enum: ["Nutrition Plan", "Workout Plan", "Nutrition & Workout Plan"],
  },
  description: {
    type: String,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Description is required.",
    ],
  },
  price: {
    type: Number,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Price is required.",
    ],
  },
  duration: {
    type: Number,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Duration is required.",
    ],
    min: [1, "Duration must be at least 1 month."],
  },
  subscribersLimit: {
    type: Number,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Subscribers limit is required.",
    ],
  },
  active: {
    type: Boolean,
    default: true,
  },
});

export const PackageModel = model("Package", packageSchema);
