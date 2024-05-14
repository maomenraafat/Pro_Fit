import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const challengeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  trainee: {
    type: Schema.ObjectId,
    ref: 'Trainee',
    required: true,
  },
  trainer: {  
    type: Schema.ObjectId,
    ref: 'Trainer',
    default: null,
  },
  createdBy: {
    type: Schema.ObjectId,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  timeElapsed: { 
    type: Number,
    default: 0,
  },
  finalTimeElapsed: { 
    type: Number,
    default: 0,
  },
  history: [{
    start: Date,
    end: Date,
  }]
});

export const Challenge = model('Challenge', challengeSchema);
