import mongoose from "mongoose";
const { Schema, model } = mongoose;

const freeDietPlanSubscriptionSchema = new Schema(
  {
    trainee: {
      type: Schema.ObjectId,
      ref: "Trainee",
      default: null,
    },
    trainer: {
      type: Schema.ObjectId,
      ref: "Trainer",
      default: null,
    },
    dietPlan: {
      type: Schema.ObjectId,
      ref: "nutrition",
      default: null,
    },
    days: [
      {
        startDate: {
          type: Date,
          required: false,
        },
        day: {
          type: String,
          required: false,
        },
        meals: [
          {
            mealname: {
              type: String,
              required: [false, "Meal Name is required"],
            },
            mealtype: {
              type: String,
              enum: ["Breakfast", "Lunch", "Snack", "Dinner"],
              required: false,
            },
            mealnote: {
              type: String,
            },
            foods: [
              {
                food: { type: Schema.ObjectId, ref: "food" },
                amount: {
                  type: Number,
                  default: 1,
                },
                foodname: {
                  type: String,
                  required: [false, "Food Name is required"],
                },
                foodImage: {
                  type: String,
                  required: [false, "Food Image is required"],
                },
                servingUnit: {
                  type: String,
                  enum: ["Gram", "Scoop", "Piece", "Mili", "Spoon", "Cup"],
                  default: "Gram",
                },
                consumed: {
                  type: Boolean,
                  default: false,
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
        mealsCount: {
          type: Number,
        },
        daymacros: {
          calories: { type: Number, default: 0 },
          proteins: { type: Number, default: 0 },
          fats: { type: Number, default: 0 },
          carbs: { type: Number, default: 0 },
        },
        eatenDaysMacros: {
          calories: { type: Number, default: 0 },
          proteins: { type: Number, default: 0 },
          fats: { type: Number, default: 0 },
          carbs: { type: Number, default: 0 },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const freeDietPlanSubscription = model(
  "freeDietPlanSubscription",
  freeDietPlanSubscriptionSchema
);
