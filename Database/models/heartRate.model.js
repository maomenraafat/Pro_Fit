import { Schema, model } from "mongoose";

const heartRateSchema = new Schema({
  trainee: {
    type: Schema.ObjectId,
    ref: "Trainee",
    required: true,
  },
  bpm: { 
    type: Number,
    required: true,
  }
},{
    timestamps:true
});

export const HeartRate = model("HeartRate", heartRateSchema);