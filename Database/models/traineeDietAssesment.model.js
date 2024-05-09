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
    height: {
      type: Number,
    },
    ////////////////////////////////
    /* dietpreferences*/
    foodAllergens: {
      type: [String],
      enum: [
        "Milk",
        "Eggs",
        "Fish",
        "Shellfish",
        "Tree Nuts",
        "Peanuts",
        "Wheat",
        "Soybeans",
        "Corn",
        "Gelatin",
        "Beef",
        "Chicken",
        "Mutton",
        "Sesame",
        "Sunflower",
        "Poppy",
        "Citrus",
        "Strawberries",
        "Bananas",
        "Garlic",
        "Onions",
        "Coriander",
        "Mustard",
        "Oats",
        "Rye",
      ],
    },
    disease: {
      type: [String],
      enum: [
        "Diabetes Type 1",
        "Diabetes Type 2",
        "Celiac Disease",
        "Irritable Bowel Syndrome",
        "Lactose Intolerance",
        "Hypertension",
        "Hyperlipidemia",
        "Gout",
        "Osteoporosis",
        "Kidney Disease",
        "Heart Disease",
        "Gastroesophageal Reflux Disease",
        "Obesity",
        "Anemia",
        "Polycystic Ovary Syndrome",
        "Thyroid Disorders",
      ],
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

    /*bodyMeasurements*/
    weight: {
      type: Number,
    },
    bodyFat: {
      type: Number,
    },
    waistArea: {
      type: Number,
    },
    neckArea: {
      type: Number,
    },

    /*personalData*/
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

    // bodyMeasurements: {
    //   neckCircumference: Number,
    //   chestCircumference: Number,
    //   armCircumference: Number,
    //   waistCircumference: Number,
    //   hipCircumference: Number,
    //   thighCircumference: Number,
    // },
    macros: {
      calories: { type: Number, min: 0 },
      proteins: { type: Number, min: 0 },
      fats: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
    },
    status: {
      type: String,
      enum: ["Current", "Last", "Archived"],
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
