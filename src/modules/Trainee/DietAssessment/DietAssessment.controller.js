import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { traineeDietAssesmentModel } from "../../../../Database/models/traineeDietAssesment.model.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";

const calculateMacronutrients = async (trainee) => {
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
const getFirstDiestAssessment = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  console.log(traineeId);
  const data = await traineeDietAssesmentModel.findOne({ trainee: traineeId });
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(200).json({ success: true, data });
});

const FillFirstDietAssessment = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  console.log(traineeId);
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

  const assessmentData = {
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
  };

  const updatedDietAssessment =
    await traineeDietAssesmentModel.findOneAndUpdate(
      { trainee: traineeId, status: "Current" },
      assessmentData,
      { new: true, runValidators: true }
    );

  // Check if the document was found and updated
  if (!updatedDietAssessment) {
    return res.status(404).json({
      success: false,
      message: "No current assessment found or update failed for this trainee.",
    });
  }

  const macros = await calculateMacronutrients(
    updatedDietAssessment.toObject()
  );
  updatedDietAssessment.macros = macros.macros;
  await updatedDietAssessment.save();

  const { _id, ...updateData } = updatedDietAssessment.toObject();

  const updatednutritionplan = await nutritionModel.findOneAndUpdate(
    { trainee: traineeId, status: "Current" },
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatednutritionplan) {
    return res.status(404).json({
      success: false,
      message:
        "No current nutrition plan found or update failed for this trainee.",
    });
  }

  updatednutritionplan.planmacros = macros.macros;
  await updatednutritionplan.save();

  res
    .status(200)
    .json({ success: true, data: updatedDietAssessment, updatednutritionplan });
});

export { getFirstDiestAssessment, FillFirstDietAssessment };
