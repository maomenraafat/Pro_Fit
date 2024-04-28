import { Schema, model } from "mongoose";

const favoriteSchema = new Schema({
    trainee:{
        type: Schema.ObjectId,
        ref:'Trainee',
        required:true
    },
    trainer:{
        type:Schema.ObjectId,
        ref:'Trainer',
        required:true
    }
},{
    timestamps:true
})

export const favouriteModel = model('favouriteSchema',favoriteSchema)