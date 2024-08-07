import { Schema, model } from "mongoose";

const foodSchema = new Schema(
  {
    foodname: {
      type: String,
      required: [true, "Food Name is required"],
    },
    foodImage: {
      type: String,
      required: [true, "Food Image is required"],
    },
    foodImageHash: {
      type: String,
      default: "",
    },
    description: {
      type: String,
    },
    baseMacro: {
      type: String,
      enum: [
        "mainProtein",
        "mainCarbs",
        "mainFats",
        "subProtein",
        "subCarbs",
        "subFats",
      ],
      default: null,
    },
    per: {
      type: Number,
      min: 0,
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
    category: {
      type: String,
      enum: [
        "Desserts",
        "Vegetables",
        "Fruits",
        "Bakeries",
        "Spices",
        "Seafood",
        "Juices",
        "Meat",
        "Oils",
        "Nuts",
        "Chicken",
        "Supplements",
        "Egg",
        "Milk Product",
        "Sauces",
        "Grain Product",
        "Grains",
      ],
    },
    dietType: {
      type: [String],
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
    mealtype: {
      type: [String],
      enum: ["Breakfast", "Lunch", "Snack", "Dinner"],
      required: false,
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
        "",
      ],
    },

    diseaseCompatibility: {
      type: [String],
      enum: [
        "Diabetes",
        "Hypertension",
        "Pregnancy",
        "Insulin Resistance",
        "Autoimmune Disease And Inflammation",
        "Pcos",
        "Familial Mediterranean Fever",
        "Gastric Sleeve",
        "Kidney Disease",
        "Hepatic Patient",
        "High Cholesterol",
        "Gout",
        "Lactose Intolerance",
        "Favism",
        "Hypothyroidism",
        "Hyperthyroidism",
        "Celiac Disease",
        "Salmonella infection",
        "",
      ],
    },

    religionrestriction: {
      type: [String],
      enum: [
        "Alcohol",
        "Pork",
        "Carrion",
        "Beef",
        " Meat Products",
        "Chicken",
        "",
      ],
    },

    Trainer: {
      type: Schema.ObjectId,
      ref: "Trainer",
      default: null,
    },
    admin: {
      type: Schema.ObjectId,
      ref: "admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const foodModel = model("food", foodSchema);
