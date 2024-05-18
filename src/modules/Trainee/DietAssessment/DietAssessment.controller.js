import { traineeModel } from "../../../../Database/models/Trainee.model.js";
import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { traineeBasicInfoModel } from "../../../../Database/models/traineeBasicInfo.model.js";
import { traineeDietAssessmentModel } from "../../../../Database/models/traineeDietAssessment.model.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";

const calculateMacronutrients = async (trainee) => {
  if (
    !trainee ||
    !trainee.weight ||
    !trainee.height ||
    !trainee.birthDate ||
    !trainee.gender
  ) {
    console.error("Invalid trainee data provided:", trainee);
    return { macros: { calories: 0, proteins: 0, fats: 0, carbs: 0 } }; // Return zero macros if data is incomplete
  }
  // Macronutrient ratios
  const proteinRatio = 0.3;
  const fatRatio = 0.25;
  const carbRatio = 0.45;

  const caloriesPerGramProtein = 4;
  const caloriesPerGramCarb = 4;
  const caloriesPerGramFat = 9;
  //console.log("Calculating macronutrients for:", trainee);
  const birthDate = new Date(trainee.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  //console.log("Calculated age:", age);
  let BMR;
  if (trainee.gender === "Male") {
    BMR = 10 * trainee.weight + 6.25 * trainee.height - 5 * age + 5;
  } else {
    BMR = 10 * trainee.weight + 6.25 * trainee.height - 5 * age - 161;
  }
  //console.log("Calculated BMR:", BMR);
  const activityFactors = {
    "Extremely Active": 1.9,
    "Very Active": 1.725,
    "Moderate Active": 1.55,
    "Lightly Active": 1.375,
    Inactive: 1.2,
  };
  let TDEE = BMR * (activityFactors[trainee.activityLevel] || 1);
  //console.log("TDEE before adjustment:", TDEE);

  switch (trainee.fitnessGoals) {
    case "Lose Weight":
      TDEE -= 300;
      break;
    case "Build Muscle":
      TDEE += 300;
      break;
  }

  if (TDEE < BMR) {
    TDEE = BMR;
  }

  //console.log("Final TDEE:", TDEE);

  const dailyProtein = (TDEE * proteinRatio) / caloriesPerGramProtein;
  const dailyFat = (TDEE * fatRatio) / caloriesPerGramFat;
  const dailyCarbs = (TDEE * carbRatio) / caloriesPerGramCarb;

  // console.log("Macronutrients:", {
  //   protein: dailyProtein,
  //   fat: dailyFat,
  //   carbs: dailyCarbs,
  // });
  return {
    macros: {
      calories: Math.round(TDEE),
      proteins: Math.round(dailyProtein),
      fats: Math.round(dailyFat),
      carbs: Math.round(dailyCarbs),
    },
  };
};

const getDietAssessmentsData = catchAsyncError(async (req, res, next) => {
  const data = {
    fitnessGoals: ["Lose Weight", "Build Muscle", "Healthy Lifestyle"],
    activityLevel: [
      "Extremely Active",
      "Very Active",
      "Moderate Active",
      "Lightly Active",
      "Inactive",
    ],
    foodAllergens: [
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
    disease: [
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
    religionRestriction: [
      "alcohol",
      "pork",
      "carrion",
      "Beef",
      "meat products",
    ],
    dietType: [
      "Vegetarian",
      "Vegan",
      "Ketogenic",
      "Paleo",
      "Mediterranean",
      "Standard",
      "Other",
    ],
    numberofmeals: [1, 2, 3, 4, 5, 6, 7],
  };
  res.json(data);
});

const getDietAssessments = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const data = await traineeDietAssessmentModel.findOne({ trainee: traineeId });
  // if (!data) {
  //   return next(new AppError("data not found", 404));
  // }
  res.status(200).json({ success: true, data });
});

const FillDietAssessment = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  const traineeBasicInfo = await traineeBasicInfoModel
    .findOne({
      trainee: traineeId,
    })
    .populate({
      path: "trainee",
      select: "assignedTrainer firstName lastName ",
    });

  if (!traineeBasicInfo) {
    return res.status(404).json({
      success: false,
      message: "Trainee basic info not found.",
    });
  }

  const {
    foodAllergens,
    disease,
    religionrestriction,
    dietType,
    numberofmeals,
    weight,
    bodyFat,
    waistArea,
    neckArea,
    fitnessGoals,
    activityLevel,
  } = req.body;

  const { gender, birthDate, height } = traineeBasicInfo;
  const assignedTrainer = traineeBasicInfo.trainee.assignedTrainer;
  const traineeFullName = `${traineeBasicInfo.trainee.firstName} ${traineeBasicInfo.trainee.lastName}`;

  const existingPlan = await nutritionModel.updateMany(
    { trainee: traineeId, status: "Current" },
    { status: "Archived" },
    { new: true }
  );

  const existingAssessment = await traineeDietAssessmentModel.findOneAndUpdate(
    { trainee: traineeId, status: "Current" },
    { status: "Archived" },
    { new: true }
  );

  const AssessmentData = {
    trainer: assignedTrainer,
    trainee: traineeId,
    gender,
    birthDate,
    weight,
    height,
    fitnessGoals,
    activityLevel,
    foodAllergens,
    disease,
    religionrestriction,
    dietType,
    numberofmeals,
    weight,
    bodyFat,
    waistArea,
    neckArea,
    status: "Current",
  };

  const newDietAssessment = new traineeDietAssessmentModel(AssessmentData);
  await newDietAssessment.save();

  const macros = await calculateMacronutrients({
    gender,
    birthDate,
    weight,
    height,
    fitnessGoals,
    activityLevel,
  });

  newDietAssessment.macros = macros.macros;
  await newDietAssessment.save();

  const newNutritionPlan = new nutritionModel({
    trainer: assignedTrainer,
    trainee: traineeId,
    planName: traineeFullName,
    targetmacros: macros.macros,
    status: "Current",
    foodAllergens,
    disease,
    religionrestriction,
    dietType,
    numberofmeals,
  });
  await newNutritionPlan.save();
  await traineeModel.findByIdAndUpdate(
    traineeId,
    { dietAssessmentStatus: "Ready" },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: newDietAssessment,
    updatednutritionplan: newNutritionPlan,
  });
});

export { getDietAssessments, FillDietAssessment, getDietAssessmentsData };
