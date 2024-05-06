import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const sleepTrackSchema = new Schema({
  trainee: {
    type: Schema.ObjectId,
    ref: 'Trainee',
    required: true,
  },
  fallAsleepTime: {
    type: Date,
    required: true,
  },
  wakeUpTime: {
    type: Date,
    required: true,
  },
  dateRecorded: {
    type: Date,
  }
});

export const SleepTrack = model('SleepTrack', sleepTrackSchema);
