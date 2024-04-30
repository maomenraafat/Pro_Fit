import {Schema,model} from 'mongoose'


const reviewSchema = new Schema({
    trainee:{
        type:Schema.ObjectId,
        ref:"Trainee",
        required:true
    },
    trainer:{
        type:Schema.ObjectId,
        ref:"Trainer",
        required:true
    },
    rating:{
        type:Number,
        min:[1,"Rating must be atleast 1"],
        max:[5,"Rating can't be more than 5"],
        required:true
    },
    comment:{
        type:String,
        trim:true,
        required:[true,"Comment is required"]
    }

},{
    timestamps:true
})

export const reviewModel = model("Review",reviewSchema)