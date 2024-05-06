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
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  timeElapsed: { // Total active time accumulated across all active periods
    type: Number,
    default: 0,
  },
  finalTimeElapsed: { // Recorded at the time of giving up; used for the last active period calculation
    type: Number,
    default: 0,
  },
  history: [{ // Optional: to keep track of each start and stop if multiple toggles are allowed
    start: Date,
    end: Date,
  }]
});

export const Challenge = model('Challenge', challengeSchema);
