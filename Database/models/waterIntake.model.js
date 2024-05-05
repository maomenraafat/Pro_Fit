// models/WaterRecord.model.js
import { Schema, model } from "mongoose";

const waterRecordSchema = new Schema({
    trainee: {
        type: Schema.ObjectId,
        ref: 'Trainee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    intake: { 
        type: Number,
        default: 0
    }
});

export const WaterRecord = model('WaterRecord', waterRecordSchema);

