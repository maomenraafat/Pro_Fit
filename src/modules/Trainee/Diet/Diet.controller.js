import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { traineeDietAssessmentModel } from "../../../../Database/models/traineeDietAssessment.model.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";

const getCustomizeDietPlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.user.payload.id;
  // const id = req.params.id;
  console.log(traineeId);
  const data = await nutritionModel.findOne({
    trainee: traineeId,
    //trainer: id,
    status: "Current",
  });
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(200).json({ success: true, data });
});
export { getCustomizeDietPlan };
