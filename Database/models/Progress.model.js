import mongoose from "mongoose";
const { Schema, model } = mongoose;


const progressSchema = new Schema({
  trainee: {
    type: Schema.ObjectId,
    ref: 'Trainee',
    required: true
  },
  image: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const progressModel = model('Progress', progressSchema);

