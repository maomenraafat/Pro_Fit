import { traineeModel } from "../../../../../Database/models/Trainee.model.js";
import { SleepTrack } from "../../../../../Database/models/sleepTrack.model.js";
import { catchAsyncError } from "./../../../../utils/catchAsyncError.js";
import moment from "moment-timezone";

const addSleepData = catchAsyncError(async (req, res) => {
  const { fallAsleepTime, wakeUpTime } = req.body;
  const traineeId = req.user.payload.id;
  const now = moment().tz("Africa/Cairo");
  const currentHour = now.hour();

  // This will check if the current time is evening and the sleep time is morning, implying next day
  const isNextDay =
    currentHour >= 12 &&
    ["PM"].includes(now.format("A")) &&
    ["AM"].includes(
      moment.tz(fallAsleepTime, "hh:mm A", "Africa/Cairo").format("A")
    );

  let parsedFallAsleepTime = moment.tz(
    `${fallAsleepTime}`,
    "hh:mm A",
    "Africa/Cairo"
  );
  let parsedWakeUpTime = moment.tz(`${wakeUpTime}`, "hh:mm A", "Africa/Cairo");

  if (isNextDay) {
    parsedFallAsleepTime.add(1, "days");
    parsedWakeUpTime.add(1, "days");
  }

  if (!parsedFallAsleepTime.isValid() || !parsedWakeUpTime.isValid()) {
    return res.status(400).json({
      success: false,
      message: "Invalid time format. Please use 'hh:mm A' format.",
    });
  }

  if (parsedFallAsleepTime.isSameOrAfter(parsedWakeUpTime)) {
    parsedWakeUpTime.add(1, "days"); // Adjusts the wake up time to the next day
  }

  const fallAsleepTimeDate = parsedFallAsleepTime.toDate();
  const wakeUpTimeDate = parsedWakeUpTime.toDate();
  const dateRecorded = moment().add(3, 'hours').toDate(); // Adding 3 hours to the current time to reflect Cairo time accurately

  const sleepData = await SleepTrack.create({
    trainee: traineeId,
    fallAsleepTime: fallAsleepTimeDate,
    wakeUpTime: wakeUpTimeDate,
    dateRecorded: dateRecorded,
  });

  res.status(201).json({
    success: true,
    message: "Sleep data added successfully.",
    data: sleepData,
  });
});

const getLatestSleepData = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  // Retrieve the latest sleep data for the trainee
  const latestSleepData = await SleepTrack.findOne({ trainee: traineeId })
    .sort({ dateRecorded: -1 })
    .limit(1);

  if (!latestSleepData) {
    return res.status(404).json({
      success: false,
      message: "No sleep data found for this trainee.",
    });
  }

  // Format the times and date for display
  const fallAsleepTime = moment(latestSleepData.fallAsleepTime)
    .tz("Africa/Cairo")
    .format("hh:mm A");
  const wakeUpTime = moment(latestSleepData.wakeUpTime)
    .tz("Africa/Cairo")
    .format("hh:mm A");
  const dateRecorded = moment(latestSleepData.dateRecorded)
    .tz("Africa/Cairo")
    .format("YYYY-MM-DD");

  // Calculate hours slept as a number
  const duration = moment.duration(
    moment(latestSleepData.wakeUpTime).diff(
      moment(latestSleepData.fallAsleepTime)
    )
  );
  const hoursSlept = duration.asHours(); // Convert duration to hours as a number

  // Return the formatted data
  res.status(200).json({
    success: true,
    message: "Latest sleep data retrieved successfully.",
    data: {
      _id: latestSleepData._id,
      hoursSlept,
      fallAsleepTime,
      wakeUpTime,
      dateRecorded,
    },
  });
});

const getSleepData = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  // Retrieve sleep data from the database
  const sleepData = await SleepTrack.find({ trainee: traineeId }).sort({
    dateRecorded: -1,
  });

  // Get the current date in Egypt's timezone
  const today = moment().tz("Africa/Cairo").startOf("day");

  // Map through each data entry to format it and determine the relative day
  const formattedSleepData = sleepData.map((data) => {
    // Format times without the date part
    const fallAsleepTime = moment(data.fallAsleepTime)
      .tz("Africa/Cairo")
      .format("hh:mm A");
    const wakeUpTime = moment(data.wakeUpTime)
      .tz("Africa/Cairo")
      .format("hh:mm A");
    const dateRecorded = moment(data.dateRecorded)
      .tz("Africa/Cairo")
      .format("YYYY-MM-DD");

    // Calculate hours and minutes slept taking into account timezone
    const duration = moment.duration(
      moment(data.wakeUpTime).diff(moment(data.fallAsleepTime))
    );
    const hoursSlept = `${duration.hours()} hrs ${duration.minutes()} mins`;

    return {
      _id: data._id,
      hoursSlept,
      fallAsleepTime,
      wakeUpTime,
      dateRecorded,
    };
  });

  res.status(200).json({
    success: true,
    message: "Sleep data retrieved successfully.",
    data: formattedSleepData,
  });
});

const getWeeklySleepData = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  const trainee = await traineeModel.findById(traineeId);
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: "Trainee not found.",
    });
  }

  // Get the current date in Egypt's timezone and adjust to the start of the day
  const today = moment().tz("Africa/Cairo").endOf("day").toDate(); // End of today
  const sevenDaysAgo = moment(today)
    .subtract(6, "days")
    .startOf("day")
    .toDate(); // Start of 6 days ago

  // Find sleep records for the last 7 days for the trainee
  const weeklyRecords = await SleepTrack.find({
    trainee: traineeId,
    dateRecorded: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ dateRecorded: 1 });

  const recordsMap = weeklyRecords.reduce((map, record) => {
    const date = moment(record.dateRecorded)
      .tz("Africa/Cairo")
      .startOf("day")
      .format("YYYY-MM-DD");
    const duration = moment.duration(
      moment(record.wakeUpTime).diff(moment(record.fallAsleepTime))
    );
    const hoursSlept = duration.asHours();
    map[date] = { hoursSlept, createdAt: moment(date).toISOString() };
    return map;
  }, {});

  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = moment(sevenDaysAgo)
      .add(index, "days")
      .startOf("day")
      .toISOString();
    const record = recordsMap[moment(date).format("YYYY-MM-DD")] || {
      hoursSlept: 0,
      createdAt: date,
    };
    return {
      createdAt: record.createdAt,
      hoursSlept: record.hoursSlept,
    };
  });

  res.status(200).json({
    success: true,
    message: "Weekly sleep data fetched successfully.",
    data: last7Days,
  });
});

export { addSleepData, getLatestSleepData, getSleepData, getWeeklySleepData };
