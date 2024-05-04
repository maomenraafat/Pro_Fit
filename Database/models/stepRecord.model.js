import { Schema, mongoose } from "mongoose";

const stepRecordSchema = new Schema(
  {
    trainee: {
      type: Schema.ObjectId,
      ref: "Trainee",
      require: true,
    },
    steps: {
      type: Number,
      required: true,
      default: 0,
    },
    calories: {
      type: Number,
      required: true,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
export const StepRecord = mongoose.model("StepRecord", stepRecordSchema);
