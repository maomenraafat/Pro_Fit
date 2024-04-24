import {Schema,model} from "mongoose"


const traineeBasicInfoSchema = new Schema({
    trainee: {
        type:  Schema.ObjectId,
        ref: 'Trainee',
        required: true
      },
    gender:{
        type:String,
        enum:["Male","Female"],
        default:"Male"
      },
      birthDate:{
        type:Date
      },
      weight:{
        type:Number,
      },
      height:{
        type:Number
      },
      fitnessGoals:{
        type:String,
      },
      activityLevel:{
        type:String,
      },
      religion: {
        type: String,
        trim: true,
      },
      nationality:{
        type:String,
        trim:true
      },
},{
    timestamps:true
})

export const traineeBasicInfoModel = model('traineeBasicInfo',traineeBasicInfoSchema)