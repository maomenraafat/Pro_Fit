import mongoose from "mongoose";

const { Schema } = mongoose;

const dietAssesmentSchema = new Schema(
  {
    trainee: {
      type: Schema.ObjectId,
      ref: "Trainee",
      required: true,
    },
    trainer: {
      type: Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    ///////////////////////
    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: "Male",
    },
    birthDate: {
      type: Date,
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    fitnessGoals: {
      type: String,
      enum: ["Lose Weight", "Build Muscle", "Healthy Lifestyle"],
    },
    activityLevel: {
      type: String,
      enum: [
        "Extremely Active",
        "Very Active",
        "Moderate Active",
        "Lightly Active",
        "In active",
      ],
    },
    ////////////////////////////////
    foodAllergens: {
      type: [String],
      default: [],
    },
    desease: {
      type: [String],
      default: [],
    },
    religionrestriction: {
      type: [String],
      enum: ["alcohol", "pork", "carrion", "Beef", " meat products"],
    },
    dietType: {
      type: String,
      enum: [
        "Vegetarian",
        "Vegan",
        "Ketogenic",
        "Paleo",
        "Mediterranean",
        "Standard",
        "Other",
      ],
      required: false,
    },
    numberofmeals: {
      type: Number,
      min: 1,
      required: false,
    },
    bodyMeasurements: {
      neckCircumference: Number,
      chestCircumference: Number,
      armCircumference: Number,
      waistCircumference: Number,
      hipCircumference: Number,
      thighCircumference: Number,
    },
    macros: {
      calories: { type: Number, min: 0 },
      proteins: { type: Number, min: 0 },
      fats: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
    },
    status: {
      type: String,
      enum: ["Current", "Archived"],
      default: "Current",
    },
    documents: [
      {
        title: String,
        url: String,
        uploadedDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const traineeDietAssesmentModel = mongoose.model(
  "traineeDietAssesment",
  dietAssesmentSchema
);
