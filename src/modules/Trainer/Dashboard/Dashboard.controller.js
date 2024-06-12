import Dashboard from "../../../utils/TrainerDashboard .js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import mongoose from "mongoose";
import { SubscriptionModel } from "../../../../Database/models/subscription.model.js";
import { ApiFeatures } from "../../../utils/ApiFeatures.js";

const performanceMetrics = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }
  const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
  const days = req.query.days || 99999999;

  const dashboard = new Dashboard(objectIdTrainerId);

  const [
    totalPaidAmountResult,
    totalNutritionPlansResult,
    averageRatingResult,
  ] = await Promise.allSettled([
    dashboard.getTotalPaidAmount(days),
    dashboard.getTotalNutritionPlans(days),
    dashboard.getAverageRating(),
  ]);

  const totalPaidAmount =
    totalPaidAmountResult.status === "fulfilled"
      ? totalPaidAmountResult.value
      : 0;
  const totalNutritionPlans =
    totalNutritionPlansResult.status === "fulfilled"
      ? totalNutritionPlansResult.value
      : 0;
  const averageRating =
    averageRatingResult.status === "fulfilled" ? averageRatingResult.value : 0;

  res.status(200).json({
    success: true,
    message: "Successfully retrieved performance metrics",
    data: {
      totalPaidAmount,
      totalNutritionPlans,
      totalWorkoutPlans: 0,
      averageRating: Number(averageRating),
    },
  });
});
const getDashboardData = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }
  const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);

  const dashboard = new Dashboard(objectIdTrainerId);

  const results = await Promise.allSettled([
    dashboard.getTotalSubscriptions(),
    dashboard.getSubscriptionsStatusCounts(),
    dashboard.getTotalTrainees(),
    dashboard.getTraineesStatusCounts(),
    dashboard.getPackagesWithSubscriptions(),
    dashboard.getAllSubscriptionsByStartDate(),
  ]);

  const [
    totalSubscriptionsResult,
    subscriptionsStatusCountsResult,
    totalTraineesResult,
    traineesStatusCountsResult,
    packagesWithDetailsResult,
    subscriptionsByDateResult,
  ] = results;

  const totalSubscriptions =
    totalSubscriptionsResult.status === "fulfilled"
      ? totalSubscriptionsResult.value
      : 0;
  const subscriptionsStatusCounts =
    subscriptionsStatusCountsResult.status === "fulfilled"
      ? subscriptionsStatusCountsResult.value
      : { active: 0, cancelled: 0, expired: 0 };
  const totalTrainees =
    totalTraineesResult.status === "fulfilled" ? totalTraineesResult.value : 0;
  const traineesStatusCounts =
    traineesStatusCountsResult.status === "fulfilled"
      ? traineesStatusCountsResult.value
      : { active: 0, cancelled: 0, expired: 0 };
  const packagesWithDetails =
    packagesWithDetailsResult.status === "fulfilled"
      ? packagesWithDetailsResult.value
      : { packagesCount: 0, allSubscriptions: 0, packages: [] };
  const subscriptionsByDate =
    subscriptionsByDateResult.status === "fulfilled"
      ? subscriptionsByDateResult.value
      : [];

  const subscriptionsDetails = [
    { status: "Active", value: subscriptionsStatusCounts.active },
    { status: "Cancelled", value: subscriptionsStatusCounts.cancelled },
    { status: "Expired", value: subscriptionsStatusCounts.expired },
  ];

  const traineesDetails = [
    { status: "Active", value: traineesStatusCounts.active },
    { status: "Cancelled", value: traineesStatusCounts.cancelled },
    { status: "Expired", value: traineesStatusCounts.expired },
  ];

  res.status(200).json({
    success: true,
    message: "Successfully retrieved dashboard details",
    data: {
      subscriptions: {
        total: totalSubscriptions,
        details: subscriptionsDetails,
      },
      trainees: {
        total: totalTrainees,
        details: traineesDetails,
      },
      packages: packagesWithDetails,
      subscriptionsByStartDate: subscriptionsByDate,
    },
  });
});
const getActiveReadyAssessmentTraineesDashboard = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    if (!trainerId) {
      return res.status(400).json({ message: "Trainer ID is required" });
    }
    const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);

    const dashboard = new Dashboard(objectIdTrainerId);

    const [dietAssessmentDataResult, workoutAssessmentDataResult] =
      await Promise.allSettled([
        dashboard.countActiveTraineesWithReadyDietAssessment(),
        dashboard.countActiveTraineesWithReadyWorkoutAssessment(),
      ]);

    const dietAssessmentData =
      dietAssessmentDataResult.status === "fulfilled"
        ? dietAssessmentDataResult.value
        : { count: 0, trainees: [] };
    const workoutAssessmentData =
      workoutAssessmentDataResult.status === "fulfilled"
        ? workoutAssessmentDataResult.value
        : { count: 0, trainees: [] };

    const combinedTrainees = [
      ...dietAssessmentData.trainees.map((sub) => ({
        traineeId: sub.traineeId,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        profilePhoto: sub.profilePhoto,
        assessmentStatus: sub.dietAssessmentStatus,
        assessmentType: "Diet",
        assessmentCreatedAt: sub.currentDietAssessmentCreatedAt,
      })),
      ...workoutAssessmentData.trainees.map((sub) => ({
        traineeId: sub.traineeId,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        profilePhoto: sub.profilePhoto,
        assessmentStatus: sub.workoutAssessmentStatus,
        assessmentType: "Workout",
        assessmentCreatedAt: sub.currentWorkoutAssessmentCreatedAt,
      })),
    ].sort(
      (a, b) =>
        new Date(a.assessmentCreatedAt) - new Date(b.assessmentCreatedAt)
    );

    res.status(200).json({
      success: true,
      message: "Successfully retrieved ready assessment trainees",
      data: {
        readyDietTraineesCount: dietAssessmentData.count,
        readyWorkoutTraineesCount: workoutAssessmentData.count,
        trainees: combinedTrainees,
      },
    });
  }
);

// const getDashboardData = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   if (!trainerId) {
//     return res.status(400).json({ message: "Trainer ID is required" });
//   }
//   const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
//   const days = req.query.days || 99999999; // Default to a large number if no parameter is provided

//   const dashboard = new Dashboard(objectIdTrainerId);

//   const [
//     totalPaidAmount,
//     totalNutritionPlans,
//     averageRating,
//     totalSubscriptions,
//     subscriptionsStatusCounts,
//     totalTrainees,
//     traineesStatusCounts,
//     packagesWithDetails,
//     subscriptionsByDate,
//     readyDietTraineesCount,
//     readyWorkoutTraineesCount,
//     subscriptions,
//   ] = await Promise.all([
//     dashboard.getTotalPaidAmount(days),
//     dashboard.getTotalNutritionPlans(days),
//     dashboard.getAverageRating(),
//     dashboard.getTotalSubscriptions(),
//     dashboard.getSubscriptionsStatusCounts(),
//     dashboard.getTotalTrainees(),
//     dashboard.getTraineesStatusCounts(),
//     dashboard.getPackagesWithSubscriptions(),
//     dashboard.getAllSubscriptionsByStartDate(),
//     dashboard.countActiveTraineesWithReadyDietAssessment(),
//     dashboard.countActiveTraineesWithReadyWorkoutAssessment(),
//     SubscriptionModel.aggregate([
//       {
//         $match: {
//           trainerId: objectIdTrainerId,
//           status: "Active",
//         },
//       },
//       {
//         $lookup: {
//           from: "trainees",
//           let: { traineeId: "$traineeId" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$_id", "$$traineeId"] },
//                     {
//                       $or: [
//                         { $eq: ["$dietAssessmentStatus", "Ready"] },
//                         { $eq: ["$workoutAssessmentStatus", "Ready"] },
//                       ],
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               $lookup: {
//                 from: "traineedietassessments",
//                 let: { trainee: "$_id" },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $and: [
//                           { $eq: ["$trainee", "$$trainee"] },
//                           { $eq: ["$status", "Current"] },
//                         ],
//                       },
//                     },
//                   },
//                   { $sort: { createdAt: -1 } },
//                   { $limit: 1 },
//                 ],
//                 as: "currentDietAssessment",
//               },
//             },
//             {
//               $lookup: {
//                 from: "traineeworkoutassessments",
//                 let: { trainee: "$_id" },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $and: [
//                           { $eq: ["$trainee", "$$trainee"] },
//                           { $eq: ["$status", "Current"] },
//                         ],
//                       },
//                     },
//                   },
//                   { $sort: { createdAt: -1 } },
//                   { $limit: 1 },
//                 ],
//                 as: "currentWorkoutAssessment",
//               },
//             },
//             {
//               $project: {
//                 _id: 1,
//                 firstName: 1,
//                 lastName: 1,
//                 email: 1,
//                 profilePhoto: 1,
//                 dietAssessmentStatus: 1,
//                 workoutAssessmentStatus: 1,
//                 currentDietAssessment: {
//                   $arrayElemAt: ["$currentDietAssessment", 0],
//                 },
//                 currentWorkoutAssessment: {
//                   $arrayElemAt: ["$currentWorkoutAssessment", 0],
//                 },
//               },
//             },
//           ],
//           as: "traineeDetails",
//         },
//       },
//       { $unwind: "$traineeDetails" },
//       {
//         $lookup: {
//           from: "packages",
//           localField: "package",
//           foreignField: "_id",
//           as: "packageDetails",
//         },
//       },
//       { $unwind: "$packageDetails" },
//       { $sort: { "traineeDetails.currentDietAssessment.createdAt": -1 } },
//     ]),
//   ]);

//   const subscriptionsDetails = [
//     { status: "Active", value: subscriptionsStatusCounts.active },
//     { status: "Cancelled", value: subscriptionsStatusCounts.cancelled },
//     { status: "Expired", value: subscriptionsStatusCounts.expired },
//   ];

//   const traineesDetails = [
//     { status: "Active", value: traineesStatusCounts.active },
//     { status: "Cancelled", value: traineesStatusCounts.cancelled },
//     { status: "Expired", value: traineesStatusCounts.expired },
//   ];

//   const responseSubscriptions = subscriptions.map((sub) => ({
//     traineeId: {
//       _id: sub.traineeDetails._id,
//       firstName: sub.traineeDetails.firstName,
//       lastName: sub.traineeDetails.lastName,
//       email: sub.traineeDetails.email,
//       profilePhoto: sub.traineeDetails.profilePhoto,
//       dietAssessmentStatus: sub.traineeDetails.dietAssessmentStatus,
//       workoutAssessmentStatus: sub.traineeDetails.workoutAssessmentStatus,
//       currentDietAssessmentCreatedAt:
//         sub.traineeDetails.currentDietAssessment?.createdAt,
//       currentWorkoutAssessmentCreatedAt:
//         sub.traineeDetails.currentWorkoutAssessment?.createdAt,
//     },
//   }));

//   res.status(200).json({
//     success: true,
//     message:
//       "Successfully retrieved dashboard data and active ready assessment trainees",
//     data: {
//       financial: {
//         totalPaidAmount,
//         totalNutritionPlans,
//         totalWorkoutPlans: 0,
//         averageRating: Number(averageRating),
//       },
//       subscriptions: {
//         total: totalSubscriptions,
//         details: subscriptionsDetails,
//       },
//       trainees: {
//         total: totalTrainees,
//         details: traineesDetails,
//       },
//       packages: packagesWithDetails,
//       subscriptionsByStartDate: subscriptionsByDate,
//       readyAssessmentTrainees: {
//         readyDietTraineesCount,
//         readyWorkoutTraineesCount,
//         trainees: responseSubscriptions,
//       },
//     },
//   });
// });

// const getDashboardData = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   if (!trainerId) {
//     return res.status(400).json({ message: "Trainer ID is required" });
//   }
//   const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
//   const days = req.query.days || 99999999;

//   const dashboard = new Dashboard(objectIdTrainerId);

//   const results = await Promise.allSettled([
//     dashboard.getTotalPaidAmount(days),
//     dashboard.getTotalNutritionPlans(days),
//     dashboard.getAverageRating(),
//     dashboard.getTotalSubscriptions(),
//     dashboard.getSubscriptionsStatusCounts(),
//     dashboard.getTotalTrainees(),
//     dashboard.getTraineesStatusCounts(),
//     dashboard.getPackagesWithSubscriptions(),
//     dashboard.getAllSubscriptionsByStartDate(),
//     dashboard.countActiveTraineesWithReadyDietAssessment(),
//     dashboard.countActiveTraineesWithReadyWorkoutAssessment(),
//   ]);

//   const [
//     totalPaidAmountResult,
//     totalNutritionPlansResult,
//     averageRatingResult,
//     totalSubscriptionsResult,
//     subscriptionsStatusCountsResult,
//     totalTraineesResult,
//     traineesStatusCountsResult,
//     packagesWithDetailsResult,
//     subscriptionsByDateResult,
//     dietAssessmentDataResult,
//     workoutAssessmentDataResult,
//   ] = results;

//   const totalPaidAmount =
//     totalPaidAmountResult.status === "fulfilled"
//       ? totalPaidAmountResult.value
//       : 0;
//   const totalNutritionPlans =
//     totalNutritionPlansResult.status === "fulfilled"
//       ? totalNutritionPlansResult.value
//       : 0;
//   const averageRating =
//     averageRatingResult.status === "fulfilled" ? averageRatingResult.value : 0;
//   const totalSubscriptions =
//     totalSubscriptionsResult.status === "fulfilled"
//       ? totalSubscriptionsResult.value
//       : 0;
//   const subscriptionsStatusCounts =
//     subscriptionsStatusCountsResult.status === "fulfilled"
//       ? subscriptionsStatusCountsResult.value
//       : { active: 0, cancelled: 0, expired: 0 };
//   const totalTrainees =
//     totalTraineesResult.status === "fulfilled" ? totalTraineesResult.value : 0;
//   const traineesStatusCounts =
//     traineesStatusCountsResult.status === "fulfilled"
//       ? traineesStatusCountsResult.value
//       : { active: 0, cancelled: 0, expired: 0 };
//   const packagesWithDetails =
//     packagesWithDetailsResult.status === "fulfilled"
//       ? packagesWithDetailsResult.value
//       : { packagesCount: 0, allSubscriptions: 0, packages: [] };
//   const subscriptionsByDate =
//     subscriptionsByDateResult.status === "fulfilled"
//       ? subscriptionsByDateResult.value
//       : [];
//   const dietAssessmentData =
//     dietAssessmentDataResult.status === "fulfilled"
//       ? dietAssessmentDataResult.value
//       : { count: 0, trainees: [] };
//   const workoutAssessmentData =
//     workoutAssessmentDataResult.status === "fulfilled"
//       ? workoutAssessmentDataResult.value
//       : { count: 0, trainees: [] };

//   const subscriptionsDetails = [
//     { status: "Active", value: subscriptionsStatusCounts.active },
//     { status: "Cancelled", value: subscriptionsStatusCounts.cancelled },
//     { status: "Expired", value: subscriptionsStatusCounts.expired },
//   ];

//   const traineesDetails = [
//     { status: "Active", value: traineesStatusCounts.active },
//     { status: "Cancelled", value: traineesStatusCounts.cancelled },
//     { status: "Expired", value: traineesStatusCounts.expired },
//   ];

//   const combinedTrainees = [
//     ...dietAssessmentData.trainees.map((sub) => ({
//       traineeId: sub.traineeId,
//       firstName: sub.firstName,
//       lastName: sub.lastName,
//       email: sub.email,
//       profilePhoto: sub.profilePhoto,
//       assessmentStatus: sub.dietAssessmentStatus,
//       assessmentType: "Diet",
//       assessmentCreatedAt: sub.currentDietAssessmentCreatedAt,
//     })),
//     ...workoutAssessmentData.trainees.map((sub) => ({
//       traineeId: sub.traineeId,
//       firstName: sub.firstName,
//       lastName: sub.lastName,
//       email: sub.email,
//       profilePhoto: sub.profilePhoto,
//       assessmentStatus: sub.workoutAssessmentStatus,
//       assessmentType: "Workout",
//       assessmentCreatedAt: sub.currentWorkoutAssessmentCreatedAt,
//     })),
//   ].sort(
//     (a, b) => new Date(a.assessmentCreatedAt) - new Date(b.assessmentCreatedAt)
//   );

//   res.status(200).json({
//     success: true,
//     message:
//       "Successfully retrieved dashboard data and active ready assessment trainees",
//     data: {
//       PerformanceMetrics: {
//         totalPaidAmount,
//         totalNutritionPlans,
//         totalWorkoutPlans: 0,
//         averageRating: Number(averageRating),
//       },
//       subscriptions: {
//         total: totalSubscriptions,
//         details: subscriptionsDetails,
//       },
//       trainees: {
//         total: totalTrainees,
//         details: traineesDetails,
//       },
//       packages: packagesWithDetails,
//       subscriptionsByStartDate: subscriptionsByDate,
//       readyAssessmentTrainees: {
//         readyDietTraineesCount: dietAssessmentData.count,
//         readyWorkoutTraineesCount: workoutAssessmentData.count,
//         trainees: combinedTrainees,
//       },
//     },
//   });
// });

// const getDashboardData = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   if (!trainerId) {
//     return res.status(400).json({ message: "Trainer ID is required" });
//   }
//   const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
//   const days = req.query.days || 99999999; // Default to a large number if no parameter is provided

//   const dashboard = new Dashboard(objectIdTrainerId);

//   const [
//     totalPaidAmount,
//     totalNutritionPlans,
//     //totalWorkoutPlans,
//     averageRating,
//     totalSubscriptions,
//     subscriptionsStatusCounts,
//     totalTrainees,
//     traineesStatusCounts,
//     packagesWithDetails,
//     subscriptionsByDate,
//   ] = await Promise.all([
//     dashboard.getTotalPaidAmount(days),
//     dashboard.getTotalNutritionPlans(days),
//     //dashboard.getTotalWorkoutPlans(days),
//     dashboard.getAverageRating(),
//     dashboard.getTotalSubscriptions(),
//     dashboard.getSubscriptionsStatusCounts(),
//     dashboard.getTotalTrainees(),
//     dashboard.getTraineesStatusCounts(),
//     dashboard.getPackagesWithSubscriptions(),
//     dashboard.getAllSubscriptionsByStartDate(),
//   ]);

//   const subscriptionsDetails = [
//     { status: "Active", value: subscriptionsStatusCounts.active },
//     { status: "Cancelled", value: subscriptionsStatusCounts.cancelled },
//     { status: "Expired", value: subscriptionsStatusCounts.expired },
//   ];

//   const traineesDetails = [
//     { status: "Active", value: traineesStatusCounts.active },
//     { status: "Cancelled", value: traineesStatusCounts.cancelled },
//     { status: "Expired", value: traineesStatusCounts.expired },
//   ];

//   res.status(200).json({
//     success: true,
//     message: "Successfully retrieved dashboard data",
//     data: {
//       financial: {
//         totalPaidAmount,
//         totalNutritionPlans,
//         totalWorkoutPlans: 0,
//         averageRating: Number(averageRating),
//       },
//       subscriptions: {
//         total: totalSubscriptions,
//         details: subscriptionsDetails,
//       },
//       trainees: {
//         total: totalTrainees,
//         details: traineesDetails,
//       },
//       packages: packagesWithDetails,
//       subscriptionsByStartDate: subscriptionsByDate,
//     },
//   });
// });
// const getDashboardData = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   if (!trainerId) {
//     return res.status(400).json({ message: "Trainer ID is required" });
//   }
//   const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
//   const days = req.query.days || 99999999; // Default to last 7 days if no parameter is provided

//   const dashboard = new Dashboard(objectIdTrainerId);

//   const [totalPaidAmount, totalNutritionPlans, totalWorkoutPlans] =
//     await Promise.all([
//       dashboard.getTotalPaidAmount(days),
//       dashboard.getTotalNutritionPlans(days),
//       // dashboard.getTotalWorkoutPlans(days),
//     ]);
//   const averageRating = await dashboard.getAverageRating();

//   res.status(200).json({
//     success: true,
//     data: {
//       totalPaidAmount,
//       totalNutritionPlans,
//       totalWorkoutPlans,
//       averageRating: Number(averageRating),
//     },
//     message: "Successfully retrieved dashboard data",
//   });
// });

const getSubscriptionsDashboard = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }
  const dashboard = new Dashboard(trainerId);
  const totalSubscriptions = await dashboard.getTotalSubscriptions();
  const statusCounts = await dashboard.getSubscriptionsStatusCounts();
  // const responseData = {
  //   totalSubscriptions,
  //   activeSubscriptions: statusCounts.active,
  //   cancelledSubscriptions: statusCounts.cancelled,
  //   expiredSubscriptions: statusCounts.expired,
  // };

  // res.status(201).json({
  //   success: true,
  //   message: " Subscriptions retrieved successfully",
  //   data: responseData,
  // });
  const details = [
    { status: "Active", value: statusCounts.active },
    { status: "Cancelled", value: statusCounts.cancelled },
    { status: "Expired", value: statusCounts.expired },
  ];

  res.status(201).json({
    success: true,
    message: " Trainees retrieved successfully",
    data: { totalSubscriptions: totalSubscriptions, details },
  });

  //res.status(500).json({ message: "Failed to retrieve dashboard data" });
});

const getTraineesDashboard = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }
  const dashboard = new Dashboard(trainerId);
  const totalTrainees = await dashboard.getTotalTrainees();
  const statusCounts = await dashboard.getTraineesStatusCounts();

  const details = [
    { status: "Active", value: statusCounts.active },
    { status: "Cancelled", value: statusCounts.cancelled },
    { status: "Expired", value: statusCounts.expired },
  ];

  res.status(201).json({
    success: true,
    message: " Trainees retrieved successfully",
    data: { totalTrainees: totalTrainees, details },
  });

  //res.status(500).json({ message: "Failed to retrieve dashboard data" });
});

const getTrainerPackagesDashboard = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }
  const dashboard = new Dashboard(trainerId);
  const packagesWithDetails = await dashboard.getPackagesWithSubscriptions();

  res.status(201).json({
    success: true,
    message: "Success",
    data: packagesWithDetails,
  });
});

const getSubscriptionsByStartDate = catchAsyncError(async (req, res, next) => {
  let trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }
  trainerId = new mongoose.Types.ObjectId(trainerId);
  const dashboard = new Dashboard(trainerId);
  const subscriptionsByDate = await dashboard.getAllSubscriptionsByStartDate();

  res.status(200).json({
    success: true,
    message: "Success",
    data: subscriptionsByDate,
  });
});

// const getActiveReadyDietTraineesDashboard = catchAsyncError(
//   async (req, res, next) => {
//     const trainerId = req.user.payload.id;
//     if (!trainerId) {
//       return res.status(400).json({ message: "Trainer ID is required" });
//     }
//     const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);
//     const dashboard = new Dashboard(objectIdTrainerId);
//     const readyDietTraineesCount =
//       await dashboard.countActiveTraineesWithReadyDietAssessment();

//     res.status(200).json({
//       success: true,
//       message:
//         "Successfully retrieved the count of active trainees with ready diet assessments",
//       data: { readyDietTraineesCount },
//     });
//   }
// );

const getActiveReadyDietTraineesDashboard = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    if (!trainerId) {
      return res.status(400).json({ message: "Trainer ID is required" });
    }
    const objectIdTrainerId = new mongoose.Types.ObjectId(trainerId);

    const dashboard = new Dashboard(objectIdTrainerId);
    const readyDietTraineesCount =
      await dashboard.countActiveTraineesWithReadyDietAssessment();

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
        // totalDocuments: 0,
        // totalPages: 0,
        // page: apiFeatures.page,
        // limit: apiFeatures.limit,
        message: "No trainees found",
        data: {
          readyDietTraineesCount,
          trainees: [],
        },
      });
    }

    const responseSubscriptions = subscriptions.map((sub) => ({
      // _id: sub._id,
      // trainerId: sub.trainerId,
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
      // package: {
      //   _id: sub.packageDetails._id,
      //   packageName: sub.packageDetails.packageName,
      //   packageType: sub.packageDetails.packageType,
      // },
      // paidAmount: sub.paidAmount,
      // status: sub.status,
      // startDate: sub.startDate,
      // duration: sub.duration,
      // endDate: sub.endDate,
      // subscriptionType: sub.subscriptionType,
      // traineeSubscriptionStatus: sub.traineeSubscriptionStatus,
      // __v: sub.__v,
    }));

    res.status(200).json({
      success: true,
      // totalDocuments: responseSubscriptions.length,
      // totalPages: Math.ceil(responseSubscriptions.length / apiFeatures.limit),
      // page: apiFeatures.page,
      // limit: apiFeatures.limit,
      message:
        "Successfully retrieved the count and details of active trainees with ready diet assessments",
      data: {
        readyDietTraineesCount,
        trainees: responseSubscriptions,
      },
    });
  }
);

//////////////////////////////////////////////////////

const getAllSubscriptionsDateForTrainer = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    if (!trainerId) {
      return res.status(400).json({ message: "Trainer ID is required" });
    }
    const dashboard = new Dashboard(trainerId);
    const subscriptions = await dashboard.getAllSubscriptionsDate();

    res.status(200).json({
      success: true,
      message: "Success",
      data: subscriptions,
    });
  }
);
const getAverageRating = catchAsyncError(async (req, res) => {
  const trainerId = req.user.payload.id;
  if (!trainerId) {
    return res.status(400).json({ message: "Trainer ID is required" });
  }

  const dashboard = new Dashboard(trainerId);
  const averageRating = await dashboard.getAverageRating();

  if (averageRating === 0) {
    return res.status(200).json({
      success: true,
      message: "No reviews found for this trainer.",
      data: {
        averageRating,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Successfully retrieved the average rating",
    data: {
      averageRating: Number(averageRating),
    },
  });
});

export {
  performanceMetrics,
  getDashboardData,
  getActiveReadyAssessmentTraineesDashboard,
  getSubscriptionsDashboard,
  getTraineesDashboard,
  getTrainerPackagesDashboard,
  getAllSubscriptionsDateForTrainer,
  getSubscriptionsByStartDate,
  getActiveReadyDietTraineesDashboard,
  getAverageRating,
};
