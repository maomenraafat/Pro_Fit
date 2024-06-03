import { Schema, model } from "mongoose";

const favoriteDietPlanSchema = new Schema({
  trainee: {
    type: Schema.ObjectId,
    ref: "Trainee",
    required: true,
  },
  dietPlan: {
    type: Schema.ObjectId,
    ref: "nutrition",
    required: true,
  },
});

export const favoriteDietPlanModel = model("FavoriteDietPlan", favoriteDietPlanSchema);
