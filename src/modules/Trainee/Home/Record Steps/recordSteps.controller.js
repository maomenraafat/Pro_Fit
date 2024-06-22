import moment from "moment";
import { traineeModel } from "../../../../../Database/models/Trainee.model.js";
import { catchAsyncError } from "../../../../utils/catchAsyncError.js";
import { StepRecord } from "./../../../../../Database/models/stepRecord.model.js";

const setGoal = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const { stepGoal } = req.body;

  // Validation for stepGoal
  console.log(stepGoal);
  if (!stepGoal || stepGoal < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid step goal. It must be a positive number.",
    });
  }

  const trainee = await traineeModel.findById(traineeId);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  trainee.stepGoal = stepGoal;
  await trainee.save();

  res.status(201).json({
    success: true,
    message: "Step goal set successfully.",
    data: { stepGoal: trainee.stepGoal },
  });
});

const recordSteps = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const { steps } = req.body;

  // Create a new date object for the current time and adjust to Egypt's time zone
  const date = new Date();
  date.setHours(date.getHours() + 3); 
  date.setUTCHours(0, 0, 0, 0);

  // Fetch the trainee to get the step goal
  const trainee = await traineeModel.findById(traineeId);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Find or create the step record for today
  let stepRecord = await StepRecord.findOne({
    trainee: traineeId,
    date,
  });

  if (stepRecord) {
    // Calculate potential new steps total
    const newTotalSteps = stepRecord.steps + steps;
    // Check if the new total steps exceed the set goal
    if (newTotalSteps > trainee.stepGoal) {
      return res.status(400).json({
        success: false,
        message: "Recording these steps would exceed your daily step goal.",
      });
    }
    stepRecord.steps = newTotalSteps;
    stepRecord.calories += steps * 0.04; // 1 Step burns 0.04 calorie
    await stepRecord.save();
  } else {
    if (steps > trainee.stepGoal) {
      return res.status(400).json({
        success: false,
        message: "Recording these steps would exceed your daily step goal.",
      });
    }
    // Create a new record if no record exists for today
    await StepRecord.create({
      trainee: traineeId,
      steps,
      date,
      calories: steps * 0.04,
    });
  }
  res.status(201).json({
    success: true,
    message: "Steps recorded successfully.",
  });
});
const getTodaySteps = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const todayRecord = (await StepRecord.findOne({
    trainee: traineeId,
    date: date,
  })) || { steps: 0, calories: 0 };

  const trainee = await traineeModel.findById(traineeId);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Calculate the distance in kilometers assuming 1250 steps = 1 km
  const stepsPerKm = 1250;
  const distanceKm = (todayRecord.steps / stepsPerKm).toFixed(3); // rounded to 3 decimal places

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
      stepsGoalFormat: stepsGoalFormat, // Concatenated string of steps and goal
      calories: todayRecord.calories,
      goal: stepGoal,
      percentageComplete: parseFloat(percentage.toFixed(2)),
    },
  });
});

const getStepGoalsList = catchAsyncError(async (req, res) => {
  const stepGoalsList = [];
  for (let i = 500; i <= 30000; i += 500) {
    stepGoalsList.push(i);
  }
  res.status(200).json({
    success: true,
    message: "Step goals list fetched successfully.",
    data: stepGoalsList,
  });
});

const getWeeklyStepsForTrainee = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  const trainee = await traineeModel.findById(traineeId);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
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
    trainee: traineeId,
    date: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ date: 1 });

  // Map records to ensure each day has the record
  const recordsMap = weeklyRecords.reduce((map, record) => {
    const adjustedDate = moment(record.date).add(3, 'hours').toDate();
    const date = moment(adjustedDate).startOf('day').format("YYYY-MM-DD");
    map[date] = { steps: record.steps, calories: record.calories, date: adjustedDate };
    return map;
  }, {});

  // Fill in missing days with steps: 0, calories: 0
  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const dateString = date.toISOString().split('T')[0];
    const record = recordsMap[dateString] || { steps: 0, calories: 0, date: dateString };
    return {
      steps: record.steps,
      calories: record.calories,
      createdAt: moment(record.date).toISOString(),
    };
  });

  res.status(200).json({
    success: true,
    message: "Weekly steps fetched successfully.",
    data: last7Days,
  });
});


export { setGoal, recordSteps, getTodaySteps,getStepGoalsList,getWeeklyStepsForTrainee };
