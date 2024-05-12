import { traineeModel } from "../../../../Database/models/Trainee.model.js";
import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { SubscriptionModel } from "../../../../Database/models/subscription.model.js";
import { ApiFeatures } from "../../../utils/ApiFeatures.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";

const getActiveTrainees = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  let baseQuery = SubscriptionModel.find({
    trainerId,
  })
    .populate({
      path: "traineeId",
      select:
        "firstName lastName email profilePhoto dietAssessmentStatus  startDate endDate",
    })
    .populate({
      path: "package",
      select: "packageName packageType",
    });

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .sort()
    .search()
    .filter()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery;
  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No trainees found",
      data: [],
    });
  }

  const updateOperations = subscriptions.map(async (subscription) => {
    try {
      const trainee = subscription.traineeId;
      if (trainee && typeof trainee.setCurrentDietAssessment === "function") {
        await trainee.setCurrentDietAssessment();
      }
    } catch (error) {
      console.error("Error updating diet assessment for trainee:", error);
    }
  });

  await Promise.all(updateOperations);
  await SubscriptionModel.populate(subscriptions, {
    path: "traineeId.traineeDietAssessment",
    select: "createdAt",
  });

  let totalCount = await SubscriptionModel.countDocuments(
    apiFeatures.mongooseQuery.getQuery()
  );
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Trainees retrieved successfully",
    data: subscriptions,
  });
});
const getTraineesDietAssessment = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  let baseQuery = SubscriptionModel.find({
    trainerId,
  })
    .populate({
      path: "traineeId",
      select: "firstName lastName email profilePhoto dietAssessmentStatus  ",
    })
    .populate({
      path: "package",
      select: "packageName packageType",
    });

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .sort()
    .search()
    .filter()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery;
  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No trainees found",
      data: [],
    });
  }

  const updateOperations = subscriptions.map(async (subscription) => {
    try {
      const trainee = subscription.traineeId;
      if (trainee && typeof trainee.setCurrentDietAssessment === "function") {
        await trainee.setCurrentDietAssessment();
      }
    } catch (error) {
      console.error("Error updating diet assessment for trainee:", error);
    }
  });

  await Promise.all(updateOperations);
  await SubscriptionModel.populate(subscriptions, {
    path: "traineeId.traineeDietAssessment",
    select: "createdAt",
  });

  let totalCount = await SubscriptionModel.countDocuments(
    apiFeatures.mongooseQuery.getQuery()
  );
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  console.log(
    "Subscriptions before sorting:",
    subscriptions.map((sub) => ({
      traineeStatus: sub.traineeId.traineeDietAssessment?.dietAssessmentStatus,
      createdAt: sub.traineeId.traineeDietAssessment?.createdAt,
    }))
  );

  subscriptions.sort((a, b) => {
    const aStatus =
      a.traineeId.traineeDietAssessment?.dietAssessmentStatus || "Not Ready";
    const bStatus =
      b.traineeId.traineeDietAssessment?.dietAssessmentStatus || "Not Ready";
    const aDate = a.traineeId.traineeDietAssessment?.createdAt || new Date(0);
    const bDate = b.traineeId.traineeDietAssessment?.createdAt || new Date(0);

    if (aStatus === "Ready" && bStatus !== "Ready") {
      return -1;
    } else if (aStatus !== "Ready" && bStatus === "Ready") {
      return 1;
    }

    return new Date(aDate) - new Date(bDate);
  });

  console.log(
    "Subscriptions after sorting:",
    subscriptions.map((sub) => ({
      traineeStatus: sub.traineeId.traineeDietAssessment?.dietAssessmentStatus,
      createdAt: sub.traineeId.traineeDietAssessment?.createdAt,
    }))
  );

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Trainees retrieved successfully",
    data: subscriptions,
  });
});

const getSpecificTrainee = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await traineeModel
    .findById(id)
    .select("firstName lastName email profilePhoto");
  if (!data) {
    return next(new AppError("Trainee data not found", 404));
  }
  if (!data.traineeDietAssessment) {
    const error = await data.setCurrentDietAssessment().catch((err) => err);
    if (error instanceof Error) {
      return next(new AppError(error.message, 404));
    }
    await data.populate({
      path: "traineeDietAssessment",
      select:
        "gender birthDate height weight fitnessGoals activityLevel createdAt",
      match: { status: "Current" },
    });
  }

  if (!data.traineeDietAssessment) {
    return next(
      new AppError("No current diet assessment found for this trainee.", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

const getTraineeCustomizePlan = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const data = await nutritionModel.findOne({
    trainer: trainerId,
    trainee: id,
  });
  if (!data) {
    return next(new AppError("No nutrition plans found", 404));
  }
  res.status(200).json({ success: true, data });
});
const createTraineeCustomizePlan = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const data = await nutritionModel.findOneAndUpdate(
    {
      trainer: trainerId,
      trainee: id,
      status: "Current",
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  await traineeModel.findByIdAndUpdate(
    id,
    { dietAssessmentStatus: "Working" },
    { new: true }
  );
  res.status(200).json({
    success: true,
    message: "Customize Plan updated successfully ",
    data,
  });
});
const makeRequestAssessment = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  await traineeModel.findByIdAndUpdate(
    id,
    { dietAssessmentStatus: "In Preparation" },
    { new: true }
  );
  res.status(200).json({
    success: true,
    message: "Request sent successfully",
  });
});

export {
  getActiveTrainees,
  getTraineesDietAssessment,
  getSpecificTrainee,
  getTraineeCustomizePlan,
  createTraineeCustomizePlan,
  makeRequestAssessment,
};
