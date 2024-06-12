import AdminDashboard from "../../../utils/AdminDashboard.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";

const performanceMetrics = catchAsyncError(async (req, res, next) => {
  const days = req.query.days;
  const daysInt = parseInt(days, 10) || 99999999;
  const adminDashboard = new AdminDashboard(daysInt);

  const [
    totalPaidAmountResult,
    totalExercisesResult,
    totalFoodsResult,
    totalPendingTrainersResult,
  ] = await Promise.allSettled([
    adminDashboard.getTotalPaidAmount(),
    adminDashboard.getTotalExercises(),
    adminDashboard.getTotalFoods(),
    adminDashboard.getTotalPendingTrainers(),
  ]);

  const totalPaidAmount =
    totalPaidAmountResult.status === "fulfilled"
      ? totalPaidAmountResult.value
      : 0;
  const totalExercises =
    totalExercisesResult.status === "fulfilled"
      ? totalExercisesResult.value
      : 0;
  const totalFoods =
    totalFoodsResult.status === "fulfilled" ? totalFoodsResult.value : 0;

  const totalPendingTrainers =
    totalPendingTrainersResult.status === "fulfilled"
      ? totalPendingTrainersResult.value
      : 0;

  res.status(200).json({
    success: true,
    message: "Successfully retrieved admin metrics",
    data: {
      totalPaidAmount,
      totalExercises,
      totalFoods,
      totalPendingTrainers,
    },
  });
});
const getDashboardData = catchAsyncError(async (req, res, next) => {
  const adminDashboard = new AdminDashboard();

  const [
    CountOfSystemUsersResult,
    trainerStatusCountsResult,
    traineeStatusCountsResult,
  ] = await Promise.allSettled([
    adminDashboard.getCountOfSystemUsers(),
    adminDashboard.getTrainerStatusCounts(),
    adminDashboard.getTraineeStatusCounts(),
  ]);

  const CountOfSystemUsers =
    CountOfSystemUsersResult.status === "fulfilled"
      ? CountOfSystemUsersResult.value
      : { totalUsers: 0, data: [] };

  const trainerStatusCounts =
    trainerStatusCountsResult.status === "fulfilled"
      ? trainerStatusCountsResult.value
      : { totalTrainers: 0, statuses: [] };

  const traineeStatusCounts =
    traineeStatusCountsResult.status === "fulfilled"
      ? traineeStatusCountsResult.value
      : { totalTrainees: 0, statuses: [] };

  res.status(200).json({
    success: true,
    message: "Successfully retrieved dashboard data",
    data: {
      systemUsers: CountOfSystemUsers,
      overAllTrainers: trainerStatusCounts,
      overAllTrainees: traineeStatusCounts,
    },
  });
});
const getSubscriptionsByStartDate = catchAsyncError(async (req, res, next) => {
  const adminDashboard = new AdminDashboard();
  const subscriptionsByDate =
    await adminDashboard.getAllSubscriptionsByStartDate();

  res.status(200).json({
    success: true,
    message: "Success",
    data: subscriptionsByDate,
  });
});

const getTotalSystemUsers = catchAsyncError(async (req, res, next) => {
  const adminDashboard = new AdminDashboard();

  //const totalCounts = await adminDashboard.getTotalCounts();
  const CountOfSystemUsers = await adminDashboard.getCountOfSystemUsers();

  res.status(200).json({
    success: true,
    message: "Successfully retrieved total counts and percentages",
    data:
      //totalCounts,
      CountOfSystemUsers,
  });
});
const getTrainerStatusCounts = catchAsyncError(async (req, res, next) => {
  const adminDashboard = new AdminDashboard();
  const trainerStatusCounts = await adminDashboard.getTrainerStatusCounts();
  res.status(200).json({
    success: true,
    message: "Successfully retrieved trainer status counts",
    data: trainerStatusCounts,
  });
});
const getTraineeStatusCounts = catchAsyncError(async (req, res, next) => {
  const adminDashboard = new AdminDashboard();
  const traineeStatusCounts = await adminDashboard.getTraineeStatusCounts();
  res.status(200).json({
    success: true,
    message: "Successfully retrieved trainee status counts",
    data: traineeStatusCounts,
  });
});

export {
  performanceMetrics,
  getDashboardData,
  getTotalSystemUsers,
  getTrainerStatusCounts,
  getTraineeStatusCounts,
  getSubscriptionsByStartDate,
};
