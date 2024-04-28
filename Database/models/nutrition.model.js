import { Schema, model } from "mongoose";

const nutritionSchema = new Schema(
  {
    planName: {
      type: String,
      required: [false, "Plan Name is required"],
    },
    trainer: {
      type: Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    trainee: {
      type: Schema.Types.ObjectId,
      ref: "Trainee",
      required: false,
    },
    numberofdays: {
      type: Number,
      min: 1,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    numberofmeals: {
      type: Number,
      min: 1,
      required: false,
    },
    goal: {
      type: String,
      required: false,
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
    religionrestriction: {
      type: [String],
      enum: ["alcohol", "pork", "carrion", "Beef", " meat products"],
    },
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
    desease: {
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
    duration: {
      type: Number,
      required: true,
    },
    week: [
      {
        dayNumber: [
          {
            type: Number,
            required: false,
            meals: [
              {
                meal: [
                  {
                    mealname: {
                      type: String,
                      required: [true, "Meal Name is required"],
                    },
                    mealtype: {
                      type: String,
                      enum: ["Breackfast", "Lunch", "Snack", "Dinner"],
                      required: false,
                    },
                    mealnote: {
                      type: String,
                    },
                    ingredients: [
                      {
                        food: { type: Schema.ObjectId, ref: "food" },
                        amount: {
                          type: Number,
                          default: 1,
                        },
                        foodname: {
                          type: String,
                          required: [true, "Food Name is required"],
                        },
                        foodImage: {
                          type: String,
                          required: [true, "Food Image is required"],
                        },
                        servingUnit: {
                          type: String,
                          enum: [
                            "Gram",
                            "Scoop",
                            "Piece",
                            "Mili",
                            "Spoon",
                            "Cup",
                          ],
                          default: "Gram",
                        },
                        macros: {
                          calories: { type: Number, min: 0 },
                          proteins: { type: Number, min: 0 },
                          fats: { type: Number, min: 0 },
                          carbs: { type: Number, min: 0 },
                        },
                      },
                    ],
                    mealmacros: {
                      calories: { type: Number, min: 0 },
                      proteins: { type: Number, min: 0 },
                      fats: { type: Number, min: 0 },
                      carbs: { type: Number, min: 0 },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    planmacros: {
      calories: { type: Number, default: 0 },
      proteins: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
    },
    plantype: {
      type: String,
      enum: ["Free Plan", "Customized Plan", "My plan"],
      default: "Customized Plan",
    },
  },
  {
    timestamps: true,
  }
);

export const nutritionModel = model("nutrition", nutritionSchema);
