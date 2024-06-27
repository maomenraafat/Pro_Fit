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
import { getNutritionPlanData } from "../../../utils/factor.js";
const { ObjectId } = mongoose.Types;

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
    traineeSubscriptionStatus: "Current",
    ...(traineeIds.length > 0 && { traineeId: { $in: traineeIds } }),
  })
    .populate({
      path: "traineeId",
      select:
        "firstName lastName email profilePhoto dietAssessmentStatus startDate endDate",
      match: { _id: { $ne: null } },
    })
    .populate({
      path: "package",
      select: "packageName packageType",
    });

  let clonedQuery = baseQuery.clone();

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .sort()
    .filter()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery;
  subscriptions = subscriptions.filter(
    (subscription) => subscription.traineeId !== null
  );

  const allSubscriptions = await clonedQuery.exec();

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No trainees found",
      data: [],
      allData: allSubscriptions,
    });
  }

  allSubscriptions.forEach((subscription) => {
    if (
      subscription.status === "Cancelled" ||
      subscription.status === "Expired"
    ) {
      if (subscription.traineeId) {
        subscription.traineeId._doc.dietAssessmentStatus = "Not Allowed";
      }
    }
  });
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
    allData: allSubscriptions,
  });
});

const getTraineesDietAssessment = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }

  const basePipeline = [
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
  ];

  let baseQuery = SubscriptionModel.aggregate(basePipeline);
  let allQuery = SubscriptionModel.aggregate(basePipeline);

  let apiFeatures = new ApiFeatures(baseQuery, req.query).paginate();

  let subscriptions = await apiFeatures.mongooseQuery;
  let allSubscriptions = await allQuery.exec();

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No trainees found",
      data: [],
      allData: allSubscriptions,
    });
  }

  const mapSubscription = (sub) => ({
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
    },
    paidAmount: sub.paidAmount,
    status: sub.status,
    startDate: sub.startDate,
    duration: sub.duration,
    endDate: sub.endDate,
    subscriptionType: sub.subscriptionType,
    traineeSubscriptionStatus: sub.traineeSubscriptionStatus,
    __v: sub.__v,
  });

  const responseSubscriptions = subscriptions.map(mapSubscription);
  const allResponseSubscriptions = allSubscriptions.map(mapSubscription);

  res.status(200).json({
    success: true,
    totalDocuments: responseSubscriptions.length,
    totalPages: Math.ceil(responseSubscriptions.length / apiFeatures.limit),
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Trainees retrieved successfully",
    data: responseSubscriptions,
    allData: allResponseSubscriptions,
  });
});

const getSpecificTrainee = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const status = await SubscriptionModel.findOne({
    trainerId,
    traineeId: id,
    traineeSubscriptionStatus: "Current",
  }).select("status");
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
  data.status = status ? status.status : null;
  res.status(200).json({
    status: "success",
    data,
  });
});

const makeRequestAssessment = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const trainee = await traineeModel.findByIdAndUpdate(
    id,
    { dietAssessmentStatus: "In Preparation" },
    { new: true }
  );

  // if (trainee) {
  //   const traineeToken = trainee.fcmToken;
  //   const title = "Diet Assessment Request";
  //   const body = "Your diet assessment request is in preparation.";
  //   sendNotification(traineeToken, title, body);
  // }

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
    published: false,
    originalPlan: { $exists: false },
    status: { $ne: "First" },
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
      published: false,
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
const getTraineeDietAssessment = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const data = await traineeDietAssessmentModel.findOne({
    trainer: trainerId,
    trainee: id,
    status: "Current",
  });
  // .populate({
  //   path: "trainee",
  //   select:
  //     " firstName  lastName email profilePhoto phoneNumber  dietAssessmentStatus",
  // });
  if (!data) {
    res
      .status(200)
      .json({ success: true, message: "No nutrition plans found", data });
  }
  res.status(200).json({ success: true, data });
});
const updateTraineeDietAssessment = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const data = await traineeDietAssessmentModel.findOneAndUpdate(
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
    res
      .status(200)
      .json({ success: true, message: "No nutrition plans found", data });
  }
  const plandata = await nutritionModel.findOneAndUpdate(
    {
      trainer: trainerId,
      trainee: id,
      status: "Current",
    },
    { targetmacros: req.body.macros },
    {
      new: true,
      runValidators: true,
    }
  );
  // .populate({
  //   path: "trainee",
  //   select:
  //     " firstName  lastName email profilePhoto phoneNumber  dietAssessmentStatus",
  // });
  if (!plandata) {
    res
      .status(200)
      .json({ success: true, message: "No nutrition plans found 2", data });
  }
  res.status(200).json({ success: true, data, plandata });
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
    message: "Customize Plan created successfully",
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
      select: "packageName",
    });

  let countQuery = baseQuery.clone();

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .sort()
    .search()
    .filter()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery.exec();

  let totalCount = await countQuery.countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No Subscription found",
      data: [],
    });
  }

  const allSubscriptionsQuery = baseQuery.clone();
  const allSubscriptions = await allSubscriptionsQuery.exec();

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Subscription retrieved successfully",
    data: subscriptions,
    allData: allSubscriptions,
  });
});
const trackingCurrentTraineePlan = catchAsyncError(async (req, res, next) => {
  const traineeId = req.params.id;

  if (!traineeId) {
    return res.status(400).json({ message: "Trainee ID is required" });
  }
  const nutritionData = await getNutritionPlanData(traineeId);
  res.status(200).json({
    success: true,
    message: "Successfully retrieved nutrition tracking data",
    data: {
      Diet: nutritionData,
      Workout: {
        totalExercises: 0,
        totalExercisesDone: 0,
        percentage: 0,
      },
    },
  });
});
// const trackingTraineePlans = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const traineeId = req.params.id;
//   const period = req.params.period || 999999999;

//   if (!traineeId) {
//     return res.status(400).json({ message: "Trainee ID is required" });
//   }

//   const dietPlans = await nutritionModel
//     .find({
//       trainer: trainerId,
//       trainee: traineeId,
//       plantype: "Customized plan",
//       status: { $ne: "First" },
//     })
//     .select(
//       "planName trainer trainee daysCount numberofmeals startDate days planmacros plantype published status originalPlan timestamps"
//     );
//   console.log(dietPlans);
//   if (dietPlans.length === 0) {
//     return res.status(200).json({
//       success: true,
//       message: "No diet plans found for this trainee",
//       data: [],
//     });
//   }

//   let allDays = [];
//   const currentDate = new Date();

//   dietPlans.forEach((plan) => {
//     const filteredDays = plan.days.filter((day) => {
//       const dayDate = new Date(day.startDate);
//       const timeDifference = currentDate - dayDate;
//       const dayDifference = timeDifference / (1000 * 3600 * 24);
//       return dayDifference <= period;
//     });

//     allDays = allDays.concat(filteredDays);
//   });

//   allDays.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

//   let previousDate = null;
//   const resultDays = [];

//   allDays.forEach((day, index) => {
//     const dayDate = new Date(day.startDate);

//     if (previousDate) {
//       let nextExpectedDate = new Date(
//         previousDate.getTime() + 24 * 60 * 60 * 1000
//       );

//       while (nextExpectedDate < dayDate) {
//         resultDays.push({
//           day: `Missing Day`,
//           startDate: nextExpectedDate.toISOString(),
//           totalDayMacros: 0,
//           totalEatenDayMacros: 0,
//         });
//         nextExpectedDate = new Date(
//           nextExpectedDate.getTime() + 24 * 60 * 60 * 1000
//         );
//       }
//     }

//     resultDays.push({
//       day: day.day,
//       startDate: day.startDate,
//       totalDayMacros: day.daymacros?.calories || 0,
//       totalEatenDayMacros: day.eatenDaysMacros?.calories || 0,
//     });

//     previousDate = dayDate;
//   });

//   res.status(200).json({
//     success: true,
//     message: "Successfully retrieved nutrition tracking data",
//     data: resultDays,
//   });
// });

const trackingTraineePlans = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const traineeId = req.params.id;
  const period = req.params.period || 999999999;

  if (!traineeId) {
    return res.status(400).json({ message: "Trainee ID is required" });
  }

  const nutritionData = await getNutritionPlanData(traineeId);

  const dietPlans = await nutritionModel
    .find({
      trainer: trainerId,
      trainee: traineeId,
      plantype: "Customized plan",
      status: { $ne: "First" },
    })
    .select(
      "planName trainer trainee daysCount numberofmeals startDate days planmacros plantype published status originalPlan timestamps"
    );

  let allDays = [];
  const currentDate = new Date();

  dietPlans.forEach((plan) => {
    const filteredDays = plan.days.filter((day) => {
      const dayDate = new Date(day.startDate);
      const timeDifference = currentDate - dayDate;
      const dayDifference = timeDifference / (1000 * 3600 * 24);
      return dayDifference <= period;
    });

    allDays = allDays.concat(filteredDays);
  });

  allDays.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  let previousDate = null;
  const resultDays = [];

  allDays.forEach((day) => {
    const dayDate = new Date(day.startDate);

    if (previousDate) {
      let nextExpectedDate = new Date(
        previousDate.getTime() + 24 * 60 * 60 * 1000
      );

      while (nextExpectedDate < dayDate) {
        resultDays.push({
          day: `Missing Day`,
          startDate: nextExpectedDate.toISOString(),
          totalDayMacros: 0,
          totalEatenDayMacros: 0,
        });
        nextExpectedDate = new Date(
          nextExpectedDate.getTime() + 24 * 60 * 60 * 1000
        );
      }
    }

    resultDays.push({
      day: day.day,
      startDate: day.startDate,
      totalDayMacros: day.daymacros?.calories || 0,
      totalEatenDayMacros: day.eatenDaysMacros?.calories || 0,
    });

    previousDate = dayDate;
  });

  res.status(200).json({
    success: true,
    message: "Successfully retrieved nutrition tracking data",
    data: {
      diet: nutritionData,
      workout: {
        totalExercises: 0,
        totalExercisesDone: 0,
        percentage: 0,
      },
      dietDetails: resultDays,
    },
  });
});
// const trackingTraineePlans = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const traineeId = req.params.id;
//   const period = req.params.period || 999999999;

//   if (!traineeId) {
//     return res.status(400).json({ message: "Trainee ID is required" });
//   }
//   const nutritionData = await getNutritionPlanData(traineeId);

//   const dietPlans = await nutritionModel
//     .find({
//       trainer: trainerId,
//       trainee: traineeId,
//       plantype: "Customized plan",
//       status: { $ne: "First" },
//     })
//     .select(
//       "planName trainer trainee daysCount numberofmeals startDate days planmacros plantype published status originalPlan timestamps"
//     );

//   let allDays = [];
//   const currentDate = new Date();

//   dietPlans.forEach((plan) => {
//     const filteredDays = plan.days.filter((day) => {
//       const dayDate = new Date(day.startDate);
//       const timeDifference = currentDate - dayDate;
//       const dayDifference = timeDifference / (1000 * 3600 * 24);
//       return dayDifference <= period;
//     });

//     allDays = allDays.concat(filteredDays);
//   });

//   allDays.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

//   let previousDate = null;
//   const resultDays = [];

//   allDays.forEach((day) => {
//     const dayDate = new Date(day.startDate);

//     if (previousDate) {
//       let nextExpectedDate = new Date(
//         previousDate.getTime() + 24 * 60 * 60 * 1000
//       );

//       while (nextExpectedDate < dayDate) {
//         resultDays.push({
//           day: `Missing Day`,
//           startDate: nextExpectedDate.toISOString(),
//           totalDayMacros: 0,
//           totalEatenDayMacros: 0,
//         });
//         nextExpectedDate = new Date(
//           nextExpectedDate.getTime() + 24 * 60 * 60 * 1000
//         );
//       }
//     }

//     resultDays.push({
//       day: day.day,
//       startDate: day.startDate,
//       totalDayMacros: day.daymacros?.calories || 0,
//       totalEatenDayMacros: day.eatenDaysMacros?.calories || 0,
//     });

//     previousDate = dayDate;
//   });

//   res.status(200).json({
//     success: true,
//     message: "Successfully retrieved nutrition tracking data",
//     data: {
//       // currentPlan: {
//       Diet: nutritionData,
//       Workout: {
//         totalExercises: 0,
//         totalExercisesDone: 0,
//         percentage: 0,
//         // },
//       },
//       dietDetails: resultDays,
//     },
//   });
// });

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
    data: { waterGoal },
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
  const todayRecord = await WaterRecord.findOne({
    trainee: id,
    date,
  });

  const intake = todayRecord ? todayRecord.intake : 0;
  const recordId = todayRecord ? todayRecord._id : null;
  const waterGoal = trainee.waterGoal;
  const percentageComplete = parseInt(((intake / waterGoal) * 100).toFixed(2));

  res.status(200).json({
    success: true,
    message: "Today's water intake fetched successfully.",
    data: {
      // intake,
      goal: waterGoal,
      // percentageComplete,
    },
  });
});

const getTraineeWeeklyWaterIntakeForTrainer = catchAsyncError(
  async (req, res) => {
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

    const today = moment().tz("Africa/Cairo").endOf("day").toDate(); // End of today
    const sevenDaysAgo = moment(today)
      .subtract(6, "days")
      .startOf("day")
      .toDate(); // Start of 6 days ago

    // Find water intake records for the last 7 days for the trainee
    const weeklyRecords = await WaterRecord.find({
      trainee: id,
      date: { $gte: sevenDaysAgo, $lte: today },
    }).sort({ date: 1 });

    // Fill in missing days with value: 0
    const recordsMap = weeklyRecords.reduce((map, record) => {
      const adjustedDate = moment(record.date)
        .tz("Africa/Cairo")
        .startOf("day")
        .format("YYYY-MM-DD");
      map[adjustedDate] = {
        value: record.intake,
        createdAt: moment(record.date).tz("Africa/Cairo").toISOString(),
      };
      return map;
    }, {});

    const last7Days = Array.from({ length: 7 }).map((_, index) => {
      const date = moment(sevenDaysAgo)
        .add(index, "days")
        .startOf("day")
        .tz("Africa/Cairo")
        .format("YYYY-MM-DD");
      const record = recordsMap[date] || {
        value: 0,
        createdAt: moment(date).tz("Africa/Cairo").toISOString(),
      };
      return {
        _id: new ObjectId(), // Generate a new ObjectId
        value: record.value,
        createdAt: record.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      message: "Weekly water intake fetched successfully.",
      data: last7Days,
    });
  }
);

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
  const recordDate = moment(lastHeartRateRecord.createdAt)
    .tz("Africa/Cairo")
    .format();

  res.status(200).json({
    success: true,
    message: "Last heart rate record retrieved successfully.",
    data: {
      bpm: heartRateData,
      createdAt: recordDate,
    },
  });
});

const getLastSevenDaysHeartRateRecords = catchAsyncError(async (req, res) => {
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

  const today = moment().tz("Africa/Cairo").endOf("day").toDate(); // End of today
  const sevenDaysAgo = moment(today)
    .subtract(6, "days")
    .startOf("day")
    .toDate(); // Start of 6 days ago

  // Get the heart rate records for the last 7 days for the trainee
  let heartRateRecords = await HeartRate.find({
    trainee: id,
    createdAt: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ createdAt: 1 });

  // Map records to ensure each day has the latest record
  const recordsMap = heartRateRecords.reduce((map, record) => {
    const adjustedCreatedAt = moment(record.createdAt).add(3, "hours").toDate();
    const date = moment(adjustedCreatedAt).startOf("day").format("YYYY-MM-DD");
    if (!map[date] || moment(adjustedCreatedAt).isAfter(map[date].createdAt)) {
      map[date] = { value: record.bpm, createdAt: adjustedCreatedAt };
    }
    return map;
  }, {});

  // Fill in missing days with value: 0
  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const dateString = moment(date).startOf("day").format("YYYY-MM-DD");
    const record = recordsMap[dateString] || {
      value: 0,
      createdAt: moment(date).startOf("day").toISOString(),
    };
    return {
      _id: new ObjectId(),
      value: record.value,
      createdAt: moment(record.createdAt).toISOString(),
    };
  });

  res.status(200).json({
    success: true,
    message: "Heart rate records for the last 7 days retrieved successfully.",
    data: last7Days,
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
      // stepsAndDistance: stepsAndDistance,
      // stepsGoal: stepsGoalFormat,
      // calories: todayRecord.calories,
      goal: stepGoal,
      // percentageComplete: parseFloat(percentage.toFixed(2)),
    },
  });
});

const getWeeklyStepsForTrainer = catchAsyncError(async (req, res) => {
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

  // Get the current date in Egypt's timezone and adjust to the start of the day
  const today = new Date();
  today.setHours(today.getHours() + 3);
  today.setUTCHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  // Find step records for the last 7 days for the trainee
  const weeklyRecords = await StepRecord.find({
    trainee: id,
    date: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ date: 1 });

  // Map records to ensure each day has the record
  const recordsMap = weeklyRecords.reduce((map, record) => {
    const adjustedDate = moment(record.date).add(3, "hours").toDate();
    const date = moment(adjustedDate).startOf("day").format("YYYY-MM-DD");
    map[date] = { value: record.steps, date: adjustedDate };
    return map;
  }, {});

  // Fill in missing days with value: 0
  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const dateString = date.toISOString().split("T")[0];
    const record = recordsMap[dateString] || { value: 0, date: dateString };
    return {
      _id: new ObjectId(), // Generate a new ObjectId
      value: record.value,
      createdAt: moment(record.date).toISOString(),
    };
  });

  res.status(200).json({
    success: true,
    message: "Weekly steps fetched successfully.",
    data: last7Days,
  });
});

// const getTraineeLatestSleepData = catchAsyncError(async (req, res) => {
//   const trainerId = req.user.payload.id;
//   const { id } = req.params;

//   const trainee = await traineeModel.findById(id);

//   if (!trainee) {
//     return res.status(404).json({
//       success: false,
//       message: "Trainee not found.",
//     });
//   }

//   if (
//     !trainee.assignedTrainer ||
//     trainee.assignedTrainer.toString() !== trainerId
//   ) {
//     return res.status(403).json({
//       success: false,
//       message: "You are not authorized to view this trainee's sleep data.",
//     });
//   }

//   // Retrieve the latest sleep data for the trainee
//   const latestSleepData = await SleepTrack.findOne({ trainee: id })
//     .sort({ dateRecorded: -1 })
//     .limit(1);

//   if (!latestSleepData) {
//     const currentDate = moment().tz("Africa/Cairo").toISOString();
//     return res.status(200).json({
//       success: true,
//       message: "No sleep data found for this trainee.",
//       data: {
//         hours: 0,
//         minutes: 0,
//         createdAt: currentDate,
//       },
//     });
//   }

//   // Calculate hours and minutes slept using moment to handle durations
//   const fallAsleepMoment = moment(latestSleepData.fallAsleepTime).tz("Africa/Cairo");
//   const wakeUpMoment = moment(latestSleepData.wakeUpTime).tz("Africa/Cairo");
//   const duration = moment.duration(wakeUpMoment.diff(fallAsleepMoment));

//   const hours = Math.floor(duration.asHours());
//   const minutes = duration.minutes();

//   // Return the formatted data
//   res.status(200).json({
//     success: true,
//     message: "Latest sleep data retrieved successfully.",
//     data: {
//       _id: latestSleepData._id,
//       hours,
//       minutes,
//       createdAt: moment(latestSleepData.dateRecorded).tz("Africa/Cairo").toISOString(),
//     },
//   });
// });

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
    const currentDate = moment().tz("Africa/Cairo").toISOString();
    return res.status(200).json({
      success: true,
      message: "No sleep data found for this trainee.",
      data: {
        hours: 0,
        minutes: 0,
        createdAt: currentDate,
      },
    });
  }

  // Format the times for display in ISO format
  const fallAsleepTime = moment(latestSleepData.fallAsleepTime)
    .tz("Africa/Cairo")
    .toISOString();
  const wakeUpTime = moment(latestSleepData.wakeUpTime)
    .tz("Africa/Cairo")
    .toISOString();

  // Return the formatted data
  res.status(200).json({
    success: true,
    message: "Latest sleep data retrieved successfully.",
    data: {
      _id: latestSleepData._id,
      fallAsleepTime,
      wakeUpTime,
      createdAt: moment(latestSleepData.dateRecorded)
        .tz("Africa/Cairo")
        .toISOString(),
    },
  });
});

const getWeeklySleepForTrainer = catchAsyncError(async (req, res) => {
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
      message:
        "You are not authorized to view the sleep data for this trainee.",
    });
  }

  const today = moment().tz("Africa/Cairo").endOf("day").toDate(); // End of today in Cairo time
  const sevenDaysAgo = moment(today)
    .subtract(6, "days")
    .startOf("day")
    .toDate(); // Start of 6 days ago in Cairo time

  // Find sleep records for the last 7 days for the trainee
  const weeklyRecords = await SleepTrack.find({
    trainee: id,
    dateRecorded: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ dateRecorded: 1 });

  const recordsMap = weeklyRecords.reduce((map, record) => {
    const date = moment(record.dateRecorded)
      .tz("Africa/Cairo")
      .format("YYYY-MM-DD");
    const duration = moment.duration(
      moment(record.wakeUpTime)
        .tz("Africa/Cairo")
        .diff(moment(record.fallAsleepTime).tz("Africa/Cairo"))
    );
    const value = duration.asHours();
    map[date] = {
      value,
      createdAt: moment(record.dateRecorded).tz("Africa/Cairo").toISOString(),
    };
    return map;
  }, {});

  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = moment(sevenDaysAgo)
      .add(index, "days")
      .startOf("day")
      .tz("Africa/Cairo")
      .format("YYYY-MM-DD");
    const record = recordsMap[date] || {
      value: 0,
      createdAt: moment(date).tz("Africa/Cairo").toISOString(),
    };
    return {
      _id: new ObjectId(),
      value: record.value,
      createdAt: record.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    message: "Weekly sleep data fetched successfully.",
    data: last7Days,
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
      message:
        "You are not authorized to view the progress entries for this trainee.",
    });
  }

  // Retrieve all progress entries for the trainee
  const progress = await progressModel.find({ trainee: id });

  // Format the response to contain _id, photo, and formatted createdAt date like getProgressPhoto
  const formattedProgressEntries = progress.map((entry) => ({
    _id: entry._id,
    photo: entry.image,
    createdAt: entry.createdAt,
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
        createdAt: assessment.createdAt,
      },
      bodyFat: {
        value: assessment.bodyFat,
        createdAt: assessment.createdAt,
      },
      waistArea: {
        value: assessment.waistArea,
        createdAt: assessment.createdAt,
      },
      neckArea: {
        value: assessment.neckArea,
        createdAt: assessment.createdAt,
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

const getTraineeDataForTrainer = catchAsyncError(async (req, res) => {
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
  if (
    !trainee.assignedTrainer ||
    trainee.assignedTrainer.toString() !== trainerId
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view this trainee's data.",
    });
  }

  // Initialize data response
  const dataResponse = {};

  // Get Latest Water Intake
  const latestWaterRecord = await WaterRecord.findOne({ trainee: id })
    .sort({ date: -1 })
    .limit(1);

  const intake = latestWaterRecord ? latestWaterRecord.intake : 0;
  const waterGoal = 2000; // Specific goal
  const percentageCompleteWater = waterGoal
    ? parseInt(((intake / waterGoal) * 100).toFixed(2))
    : 0;

  dataResponse.waterIntake = {
    intake,
    goal: waterGoal,
    percentageComplete: percentageCompleteWater,
  };

  // Get Latest Sleep Data
  const latestSleepData = await SleepTrack.findOne({ trainee: id })
    .sort({ dateRecorded: -1 })
    .limit(1);

  if (!latestSleepData) {
    dataResponse.sleepData = {
      fallAsleepTime: 0,
      wakeUpTime: 0,
      createdAt: moment().tz("Africa/Cairo").toISOString(),
    };
  } else {
    const fallAsleepTime = moment(latestSleepData.fallAsleepTime)
      .tz("Africa/Cairo")
      .toISOString();
    const wakeUpTime = moment(latestSleepData.wakeUpTime)
      .tz("Africa/Cairo")
      .toISOString();
    dataResponse.sleepData = {
      _id: latestSleepData._id,
      fallAsleepTime,
      wakeUpTime,
      createdAt: moment(latestSleepData.dateRecorded)
        .tz("Africa/Cairo")
        .toISOString(),
    };
  }

  // Get Latest Heart Rate Record
  const lastHeartRateRecord = await HeartRate.findOne({ trainee: id })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!lastHeartRateRecord) {
    dataResponse.heartRate = {
      value: 0,
      createdAt: moment().tz("Africa/Cairo").toISOString(),
    };
  } else {
    const heartRateData = lastHeartRateRecord.bpm;
    const recordDate = moment(lastHeartRateRecord.createdAt)
      .tz("Africa/Cairo")
      .toISOString();
    dataResponse.heartRate = {
      value: heartRateData,
      createdAt: recordDate,
    };
  }

  // Get Latest Steps
  const latestStepRecord = await StepRecord.findOne({
    trainee: id,
  })
    .sort({ date: -1 })
    .limit(1);

  const steps = latestStepRecord ? latestStepRecord.steps : 0;
  const calories = latestStepRecord ? latestStepRecord.calories : 0;
  const stepsPerKm = 1250;
  const distanceKm = (steps / stepsPerKm).toFixed(3);
  const stepGoal = 10000; // Specific goal
  const percentageCompleteSteps = stepGoal ? (steps / stepGoal) * 100 : 0;

  dataResponse.steps = {
    value: steps,
    distanceKm,
    calories,
    target: stepGoal,
    percentageComplete: parseFloat(percentageCompleteSteps.toFixed(2)),
  };

  // Weekly Data Calculations
  const today = moment().tz("Africa/Cairo").endOf("day").toDate(); // End of today in Cairo time
  const sevenDaysAgo = moment(today)
    .subtract(6, "days")
    .startOf("day")
    .toDate(); // Start of 6 days ago in Cairo time

  // Get Weekly Steps Data
  const weeklyStepRecords = await StepRecord.find({
    trainee: id,
    date: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ date: 1 });

  const stepRecordsMap = weeklyStepRecords.reduce((map, record) => {
    const date = moment(record.date)
      .tz("Africa/Cairo")
      .startOf("day")
      .format("YYYY-MM-DD");
    if (!map[date]) {
      map[date] = { steps: 0, calories: 0 };
    }
    map[date].steps += record.steps;
    map[date].calories += record.calories;
    return map;
  }, {});

  const last7DaysSteps = Array.from({ length: 7 }).map((_, index) => {
    const date = moment(sevenDaysAgo)
      .add(index, "days")
      .startOf("day")
      .tz("Africa/Cairo")
      .add(3, "hours");
    const dateString = date.format("YYYY-MM-DD");
    const record = stepRecordsMap[dateString] || { steps: 0, calories: 0 };
    return {
      steps: record.steps,
      calories: record.calories,
      createdAt: date.toISOString(),
    };
  });

  dataResponse.weeklySteps = last7DaysSteps;

  // Get Weekly Sleep Data
  const weeklySleepRecords = await SleepTrack.find({
    trainee: id,
    dateRecorded: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ dateRecorded: 1 });

  const sleepRecordsMap = weeklySleepRecords.reduce((map, record) => {
    const date = moment(record.dateRecorded)
      .tz("Africa/Cairo")
      .format("YYYY-MM-DD");
    const duration = moment.duration(
      moment(record.wakeUpTime)
        .tz("Africa/Cairo")
        .diff(moment(record.fallAsleepTime).tz("Africa/Cairo"))
    );
    const value = duration.asHours();
    map[date] = {
      value,
      createdAt: moment(record.dateRecorded).tz("Africa/Cairo").toISOString(),
    };
    return map;
  }, {});

  const last7DaysSleep = Array.from({ length: 7 }).map((_, index) => {
    const date = moment(sevenDaysAgo)
      .add(index, "days")
      .startOf("day")
      .tz("Africa/Cairo")
      .format("YYYY-MM-DD");
    const record = sleepRecordsMap[date] || {
      value: 0,
      createdAt: moment(date).tz("Africa/Cairo").toISOString(),
    };
    return {
      _id: new ObjectId(),
      value: record.value,
      createdAt: record.createdAt,
    };
  });

  dataResponse.weeklySleep = last7DaysSleep;

  // Get Weekly Heart Rate Data
  let heartRateRecords = await HeartRate.find({
    trainee: id,
    createdAt: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ createdAt: 1 });

  const heartRateRecordsMap = heartRateRecords.reduce((map, record) => {
    const adjustedCreatedAt = moment(record.createdAt).add(3, "hours").toDate();
    const date = moment(adjustedCreatedAt).startOf("day").format("YYYY-MM-DD");
    if (!map[date] || moment(adjustedCreatedAt).isAfter(map[date].createdAt)) {
      map[date] = { value: record.bpm, createdAt: adjustedCreatedAt };
    }
    return map;
  }, {});

  const last7DaysHeartRate = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const dateString = moment(date).startOf("day").format("YYYY-MM-DD");
    const record = heartRateRecordsMap[dateString] || {
      value: 0,
      createdAt: moment(date).startOf("day").toISOString(),
    };
    return {
      _id: new ObjectId(),
      value: record.value,
      createdAt: moment(record.createdAt).toISOString(),
    };
  });

  dataResponse.weeklyHeartRate = last7DaysHeartRate;

  // Get Weekly Water Intake Data
  const weeklyWaterRecords = await WaterRecord.find({
    trainee: id,
    date: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ date: 1 });

  const waterRecordsMap = weeklyWaterRecords.reduce((map, record) => {
    const adjustedDate = moment(record.date)
      .tz("Africa/Cairo")
      .startOf("day")
      .format("YYYY-MM-DD");
    map[adjustedDate] = {
      value: record.intake,
      createdAt: moment(record.date).tz("Africa/Cairo").toISOString(),
    };
    return map;
  }, {});

  const weeklyWaterGoal = 2000; // Specific goal for weekly water intake

  const last7DaysWater = Array.from({ length: 7 }).map((_, index) => {
    const date = moment(sevenDaysAgo)
      .add(index, "days")
      .startOf("day")
      .tz("Africa/Cairo")
      .format("YYYY-MM-DD");
    const record = waterRecordsMap[date] || {
      value: 0,
      createdAt: moment(date).tz("Africa/Cairo").toISOString(),
    };
    return {
      _id: new ObjectId(),
      value: record.value,
      createdAt: record.createdAt,
      targer: weeklyWaterGoal,
    };
  });

  dataResponse.weeklyWaterIntake = last7DaysWater;

  res.status(200).json({
    success: true,
    message: "Trainee data fetched successfully.",
    data: dataResponse,
  });
});

export {
  getActiveTrainees,
  getTraineesDietAssessment,
  getSpecificTrainee,
  getAllCustomizePlans,
  getTraineeCustomizePlan,
  getTraineeDietAssessment,
  updateTraineeDietAssessment,
  createTraineeCustomizePlan,
  makeRequestAssessment,
  getTraineesSubscription,
  trackingCurrentTraineePlan,
  trackingTraineePlans,
  updateTraineeWaterGoal,
  getTraineeWaterIntakeForTrainer,
  getTraineeLatestHeartRateRecord,
  updateTraineeStepGoalForTrainer,
  getTodayStepsForTrainer,
  getTraineeLatestSleepData,
  getTraineeProgressForTrainer,
  getDietAssessmentMeasurementsForTrainer,
  getLastSevenDaysHeartRateRecords,
  getWeeklySleepForTrainer,
  getTraineeWeeklyWaterIntakeForTrainer,
  getWeeklyStepsForTrainer,
  getTraineeDataForTrainer,
};
