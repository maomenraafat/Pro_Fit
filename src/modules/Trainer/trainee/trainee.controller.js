import mongoose from "mongoose";
import { progressModel } from "../../../../Database/models/Progress.model.js";
import { traineeModel } from "../../../../Database/models/Trainee.model.js";
import { HeartRate } from "../../../../Database/models/heartRate.model.js";
import { nutritionModel } from "../../../../Database/models/nutrition.model.js";
import { SleepTrack } from "../../../../Database/models/sleepTrack.model.js";
import { StepRecord } from "../../../../Database/models/stepRecord.model.js";
import { SubscriptionModel } from "../../../../Database/models/subscription.model.js";
import { traineeDietAssessmentModel } from "../../../../Database/models/traineeDietAssessment.model.js";
import { WaterRecord } from "../../../../Database/models/waterIntake.model.js";
import { ApiFeatures } from "../../../utils/ApiFeatures.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import moment from "moment";

const getActiveTrainees = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  let traineeIds = [];

  if (req.query.keywords) {
    const nameParts = req.query.keywords.split(" ");
    let query = {};

    if (nameParts.length > 1) {
      query = {
        $or: [
          {
            firstName: { $regex: nameParts[0], $options: "i" },
            lastName: { $regex: nameParts[1], $options: "i" },
          },
          {
            firstName: { $regex: nameParts[1], $options: "i" },
            lastName: { $regex: nameParts[0], $options: "i" },
          },
        ],
      };
    } else {
      query = {
        $or: [
          { firstName: { $regex: req.query.keywords, $options: "i" } },
          { lastName: { $regex: req.query.keywords, $options: "i" } },
        ],
      };
    }

    const trainees = await traineeModel.find(query).select("_id");
    traineeIds = trainees.map((trainee) => trainee._id);
  }

  let baseQuery = SubscriptionModel.find({
    trainerId: trainerId,
    //status: "Active",
    traineeSubscriptionStatus: "Current",
    ...(traineeIds.length > 0 && { traineeId: { $in: traineeIds } }),
  })
    .populate({
      path: "traineeId",
      select:
        "firstName lastName email profilePhoto dietAssessmentStatus  startDate endDate",
      match: { _id: { $ne: null } },
    })
    .populate({
      path: "package",
      select: "packageName packageType",
    });

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .sort()
    .filter()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery;
  subscriptions = subscriptions.filter(
    (subscription) => subscription.traineeId !== null
  );
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
  subscriptions.forEach((subscription) => {
    if (
      subscription.status === "Cancelled" ||
      subscription.status === "Expired"
    ) {
      if (subscription.traineeId) {
        subscription.traineeId._doc.dietAssessmentStatus = "Not Allowed";
      }
    }
  });

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
  const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }

  let baseQuery = SubscriptionModel.aggregate([
    {
      $match: {
        trainerId: objectIdTrainerId,
        status: "Active",
      },
    },
    {
      $lookup: {
        from: "trainees",
        let: { traineeId: "$traineeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$traineeId"] },
                  { $eq: ["$dietAssessmentStatus", "Ready"] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "traineedietassessments",
              let: { trainee: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$trainee", "$$trainee"] },
                        { $eq: ["$status", "Current"] },
                      ],
                    },
                  },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
              ],
              as: "currentAssessment",
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              profilePhoto: 1,
              dietAssessmentStatus: 1,
              currentAssessment: { $arrayElemAt: ["$currentAssessment", 0] },
            },
          },
        ],
        as: "traineeDetails",
      },
    },
    { $unwind: "$traineeDetails" },
    {
      $lookup: {
        from: "packages",
        localField: "package",
        foreignField: "_id",
        as: "packageDetails",
      },
    },
    { $unwind: "$packageDetails" },
    { $sort: { "traineeDetails.currentAssessment.createdAt": -1 } },
  ]);

  let apiFeatures = new ApiFeatures(baseQuery, req.query).paginate();

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

  const responseSubscriptions = subscriptions.map((sub) => ({
    _id: sub._id,
    trainerId: sub.trainerId,
    traineeId: {
      _id: sub.traineeDetails._id,
      firstName: sub.traineeDetails.firstName,
      lastName: sub.traineeDetails.lastName,
      email: sub.traineeDetails.email,
      profilePhoto: sub.traineeDetails.profilePhoto,
      dietAssessmentStatus: sub.traineeDetails.dietAssessmentStatus,
      currentAssessmentCreatedAt:
        sub.traineeDetails.currentAssessment.createdAt,
    },
    package: {
      _id: sub.packageDetails._id,
      packageName: sub.packageDetails.packageName,
      packageType: sub.packageDetails.packageType,
      // description: sub.packageDetails.description,
      // price: sub.packageDetails.price,
      // duration: sub.packageDetails.duration,
      // subscribersLimit: sub.packageDetails.subscribersLimit,
    },
    paidAmount: sub.paidAmount,
    status: sub.status,
    startDate: sub.startDate,
    duration: sub.duration,
    endDate: sub.endDate,
    subscriptionType: sub.subscriptionType,
    traineeSubscriptionStatus: sub.traineeSubscriptionStatus,
    __v: sub.__v,
  }));

  res.status(200).json({
    success: true,
    totalDocuments: responseSubscriptions.length,
    totalPages: Math.ceil(responseSubscriptions.length / apiFeatures.limit),
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Trainees retrieved successfully",
    data: responseSubscriptions,
  });
});

const getSpecificTrainee = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const data = await traineeModel
    .findById(id)
    .select(
      "firstName lastName email profilePhoto phoneNumber dietAssessmentStatus"
    );
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
  // console.log(data);
  // // if (!data.traineeDietAssessment) {
  // //   return next(
  // //     new AppError("No current diet assessment found for this trainee.", 404)
  // //   );
  // // }

  res.status(200).json({
    status: "success",
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
const getAllCustomizePlans = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  let baseQuery = nutritionModel.find({
    trainer: trainerId,
    trainee: id,
  });

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .sort()
    .search()
    .filter()
    .paginate()
    .fields();

  let data = await apiFeatures.mongooseQuery;
  if (!data || data.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No Plans found",
      data: [],
    });
  }

  let totalCount = await nutritionModel.countDocuments(
    apiFeatures.mongooseQuery.getQuery()
  );
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Plans retrieved successfully",
    data,
  });
});
const getTraineeCustomizePlan = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const data = await nutritionModel
    .findOne({
      trainer: trainerId,
      trainee: id,
      status: "Current",
    })
    .populate({
      path: "trainee",
      select:
        " firstName  lastName email profilePhoto phoneNumber  dietAssessmentStatus",
    });
  if (!data) {
    return next(new AppError("No nutrition plans found", 404));
  }
  res.status(200).json({ success: true, data });
});

const createTraineeCustomizePlan = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const numberOfWeeks = req.body.numberOfWeeks;

  const updatedPlan = await nutritionModel.findOneAndUpdate(
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

  if (!updatedPlan) {
    return next(new AppError("Nutrition plan not found", 404));
  }

  const daysToDuplicate = updatedPlan.days.slice(0, 7);

  const newDays = [];
  for (let i = 0; i < numberOfWeeks; i++) {
    daysToDuplicate.forEach((day, index) => {
      const newDay = { ...day.toObject() };
      newDay._id = undefined;
      newDay.day = `Day ${updatedPlan.days.length + newDays.length + 1}`;
      newDays.push(newDay);
    });
  }

  updatedPlan.days.push(...newDays);

  await updatedPlan.save();

  await traineeModel.findByIdAndUpdate(
    id,
    { dietAssessmentStatus: "Working" },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Customize Plan updated and duplicated successfully",
    data: updatedPlan,
  });
});

const getTraineesSubscription = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  let baseQuery = SubscriptionModel.find({
    trainerId,
    traineeId: id,
  })
    .select("subscriptionType duration paidAmount startDate endDate status")
    .populate({
      path: "package",
      select: "packageName ",
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
      message: "No  Subscription found",
      data: [],
    });
  }

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
    message: " Subscription retrieved successfully",
    data: subscriptions,
  });
});

const updateTraineeWaterGoal = catchAsyncError(async (req, res) => {
  const traineeId = req.params.id;
  const trainerId = req.user.payload.id;
  const { waterGoal } = req.body;

  if (!waterGoal || waterGoal <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid water goal. It must be a positive number.",
    });
  }

  const trainee = await traineeModel.findById(traineeId);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Check if the trainee has an assigned trainer
  if (!trainee.assignedTrainer) {
    return res.status(403).json({
      success: false,
      message: "Trainee does not have an assigned trainer.",
    });
  }

  // Check if the trainer making the request is assigned to the trainee
  if (trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to update the water goal for this trainee.",
    });
  }

  trainee.waterGoal = waterGoal;
  await trainee.save();

  res.status(200).json({
    success: true,
    message: "Water goal updated successfully.",
    data: waterGoal,
  });
});

const getTraineeWaterIntakeForTrainer = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.payload.id;

  // Find the trainee
  const trainee = await traineeModel.findById(id);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Check if the trainee has an assigned trainer
  if (!trainee.assignedTrainer) {
    return res.status(403).json({
      success: false,
      message: "Trainee does not have an assigned trainer.",
    });
  }

  // Check if the trainer making the request is assigned to the trainee
  if (trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to view the water intake details for this trainee.",
    });
  }

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  // Find today's water intake record for the trainee
  const todayRecord = (await WaterRecord.findOne({
    trainee: id,
    date,
  })) || { intake: 0 };

  const waterGoal = trainee.waterGoal;
  const percentageComplete = parseInt(
    ((todayRecord.intake / waterGoal) * 100).toFixed(2)
  );

  res.status(200).json({
    success: true,
    message: "Today's water intake fetched successfully.",
    data: {
      intake: todayRecord.intake,
      goal: waterGoal,
      percentageComplete,
    },
  });
});

const getTraineeLatestHeartRateRecord = catchAsyncError(async (req, res) => {
  const trainerId = req.user.payload.id;
  const { id } = req.params;

  const trainee = await traineeModel.findById(id);

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  if (
    !trainee.assignedTrainer ||
    trainee.assignedTrainer.toString() !== trainerId
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to view this trainee's heart rate records.",
    });
  }

  const lastHeartRateRecord = await HeartRate.findOne({ trainee: id })
    .sort({ _id: -1 })
    .limit(1);

  if (!lastHeartRateRecord) {
    return res.status(404).json({
      success: false,
      message: "No heart rate record found for this trainee.",
    });
  }

  const heartRateData = lastHeartRateRecord.bpm;
  const recordDate = lastHeartRateRecord.createdAt.toISOString();

  res.status(200).json({
    success: true,
    message: "Last heart rate record retrieved successfully.",
    data: {
      bpm: heartRateData,
      date: recordDate,
    },
  });
});

const updateTraineeStepGoalForTrainer = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.payload.id;
  const { stepGoal } = req.body;

  // Validation for stepGoal
  if (!stepGoal || stepGoal < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid step goal. It must be a positive number.",
    });
  }

  const trainee = await traineeModel.findById(id);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Check if the trainee has an assigned trainer
  if (!trainee.assignedTrainer) {
    return res.status(403).json({
      success: false,
      message: "Trainee does not have an assigned trainer.",
    });
  }

  // Check if the trainer making the request is assigned to the trainee
  if (trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to update the step goal for this trainee.",
    });
  }

  trainee.stepGoal = stepGoal;
  await trainee.save();

  res.status(200).json({
    success: true,
    message: "Step goal updated successfully.",
    data: { stepGoal: trainee.stepGoal },
  });
});

const getTodayStepsForTrainer = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.payload.id;

  const trainee = await traineeModel.findById(id);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Check if the trainee has an assigned trainer
  if (!trainee.assignedTrainer) {
    return res.status(403).json({
      success: false,
      message: "Trainee does not have an assigned trainer.",
    });
  }

  // Check if the trainer making the request is assigned to the trainee
  if (trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view the steps for this trainee.",
    });
  }

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const todayRecord = (await StepRecord.findOne({
    trainee: id,
    date: date,
  })) || { steps: 0, calories: 0 };

  // Calculate the distance in kilometers assuming 1250 steps = 1 km
  const stepsPerKm = 1250;
  const distanceKm = (todayRecord.steps / stepsPerKm).toFixed(3);

  const stepGoal = trainee.stepGoal;
  const percentage = (todayRecord.steps / stepGoal) * 100;

  // Format the steps and distance in the desired format
  const stepsAndDistance = `${todayRecord.steps} Step | ${distanceKm} Km`;

  // Concatenate steps with goal in the desired format "176 / 1000 Steps"
  const stepsGoalFormat = `${todayRecord.steps} / ${stepGoal} Steps`;

  res.status(200).json({
    success: true,
    message: "Today's steps fetched successfully.",
    data: {
      stepsAndDistance: stepsAndDistance,
      stepsGoalFormat: stepsGoalFormat,
      calories: todayRecord.calories,
      goal: stepGoal,
      percentageComplete: parseFloat(percentage.toFixed(2)),
    },
  });
});

const getTraineeLatestSleepData = catchAsyncError(async (req, res) => {
  const trainerId = req.user.payload.id;
  const { id } = req.params;

  const trainee = await traineeModel.findById(id);

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  if (
    !trainee.assignedTrainer ||
    trainee.assignedTrainer.toString() !== trainerId
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view this trainee's sleep data.",
    });
  }

  // Retrieve the latest sleep data for the trainee
  const latestSleepData = await SleepTrack.findOne({ trainee: id })
    .sort({ dateRecorded: -1 })
    .limit(1);

  if (!latestSleepData) {
    const currentDate = new Date().toISOString();
    return res.status(200).json({
      success: true,
      message: "No sleep data found for this trainee.",
      data: {
        hoursSlept: "0 hrs 0 mins",
        date: currentDate,
      },
    });
  }

  // Calculate hours and minutes slept
  const duration = moment.duration(
    moment(latestSleepData.wakeUpTime).diff(
      moment(latestSleepData.fallAsleepTime)
    )
  );
  const hoursSlept = `${duration.hours()} hrs ${duration.minutes()} mins`;

  // Return the formatted data
  res.status(200).json({
    success: true,
    message: "Latest sleep data retrieved successfully.",
    data: {
      _id: latestSleepData._id,
      hoursSlept,
      fallAsleepTime: new Date(latestSleepData.fallAsleepTime).toISOString(),
      wakeUpTime: new Date(latestSleepData.wakeUpTime).toISOString(),
      dateRecorded: new Date(latestSleepData.dateRecorded).toISOString(),
    },
  });
});

const getTraineeProgressForTrainer = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.payload.id;

  const trainee = await traineeModel.findById(id);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Check if the trainee has an assigned trainer
  if (!trainee.assignedTrainer) {
    return res.status(403).json({
      success: false,
      message: "Trainee does not have an assigned trainer.",
    });
  }

  // Check if the trainer making the request is assigned to the trainee
  if (trainee.assignedTrainer.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view the progress entries for this trainee.",
    });
  }

  // Retrieve all progress entries for the trainee
  const progress = await progressModel.find({ trainee: id });

  // Format the response to contain _id, photo, and formatted createdAt date like getProgressPhoto
  const formattedProgressEntries = progress.map(entry => ({
    _id: entry._id,
    photo: entry.image,
    createdAt: entry.createdAt  // Assuming you want to keep the original createdAt format
  }));

  res.status(200).json({
    success: true,
    message: "Progress entries retrieved successfully.",
    data: formattedProgressEntries,
  });
});

const getDietAssessmentMeasurementsForTrainer = catchAsyncError(
  async (req, res) => {
    const trainerId = req.user.payload.id;
    const { id } = req.params;

    // Find the trainee
    const trainee = await traineeModel.findById(id);
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: "Trainee not found.",
      });
    }

    // Check if the trainee is assigned to the trainer
    if (trainee.assignedTrainer.toString() !== trainerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this trainee's measurements.",
      });
    }

    // Retrieve all diet assessments for the trainee
    const assessments = await traineeDietAssessmentModel
      .find({ trainee: id })
      .sort({ createdAt: -1 });

    // Format the assessments
    const formattedAssessments = assessments.map((assessment) => ({
      weight: {
        value: assessment.weight,
        date: moment(assessment.createdAt).format("D MMMM, YYYY"),
      },
      bodyFat: {
        value: assessment.bodyFat,
        date: moment(assessment.createdAt).format("D MMMM, YYYY"),
      },
      waistArea: {
        value: assessment.waistArea,
        date: moment(assessment.createdAt).format("D MMMM, YYYY"),
      },
      neckArea: {
        value: assessment.neckArea,
        date: moment(assessment.createdAt).format("D MMMM, YYYY"),
      },
    }));

    // Group assessments by measurement type
    const groupedAssessments = {
      weight: formattedAssessments.map((a) => a.weight),
      bodyFat: formattedAssessments.map((a) => a.bodyFat),
      waistArea: formattedAssessments.map((a) => a.waistArea),
      neckArea: formattedAssessments.map((a) => a.neckArea),
    };

    res.status(200).json({
      success: true,
      message: "Diet assessment measurements retrieved successfully.",
      data: groupedAssessments,
    });
  }
);

export {
  getActiveTrainees,
  getTraineesDietAssessment,
  getSpecificTrainee,
  getAllCustomizePlans,
  getTraineeCustomizePlan,
  createTraineeCustomizePlan,
  makeRequestAssessment,
  getTraineesSubscription,
  updateTraineeWaterGoal,
  getTraineeWaterIntakeForTrainer,
  getTraineeLatestHeartRateRecord,
  updateTraineeStepGoalForTrainer,
  getTodayStepsForTrainer,
  getTraineeLatestSleepData,
  getTraineeProgressForTrainer,
  getDietAssessmentMeasurementsForTrainer,
};
