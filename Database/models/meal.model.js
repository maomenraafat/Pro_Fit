import { Schema, model } from "mongoose";

const mealSchema = new Schema(
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
          enum: ["Gram", "Scoop", "Piece", "Mili", "Spoon", "Cup"],
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
    Trainer: {
      type: Schema.ObjectId,
      ref: "Trainer",
      default: null,
    },
    admin: {
      type: Schema.ObjectId,
      ref: "Trainer",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
mealSchema.pre("findById", function () {
  this.populate("ingredients.food.foodname");
});

export const mealModel = model("meal", mealSchema);
