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
        enum:['Lose Weight','Build Muscle','Healthy Lifestyle'],
      },
      activityLevel:{
        type:String,
        enum:['Extremely Active','Very Active','Moderate Active','Lightly Active',"In active"]
      },
},{
    timestamps:true
})

export const traineeBasicInfoModel = model('traineeBasicInfo',traineeBasicInfoSchema)