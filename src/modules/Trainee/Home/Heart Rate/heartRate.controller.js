import moment from "moment";
import { HeartRate } from "../../../../../Database/models/heartRate.model.js";
import { catchAsyncError } from "../../../../utils/catchAsyncError.js";
import { traineeModel } from "../../../../../Database/models/Trainee.model.js";

const recordHeartRate = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;
  const { bpm } = req.body;

  // Get the current time in Egypt's timezone
  const egyptTime = moment().tz("Africa/Cairo");

  const newHeartRate = await HeartRate.create({
    trainee: traineeId,
    bpm: bpm,
    createdAt: egyptTime.toDate(),
  });

  res.status(201).json({
    success: true,
    message: "Heart rate data recorded successfully.",
    data: {
      bpm: newHeartRate.bpm,
      createdAt: egyptTime.format(), // Format to ISO string in Egypt's time zone
    },
  });
});

const getLastHeartRateRecord = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  // Get the most recent heart rate record for the trainee
  const lastHeartRateRecord = await HeartRate.findOne({ trainee: traineeId })
    .sort({ _id: -1 })
    .limit(1);

  if (!lastHeartRateRecord) {
    return res.status(404).json({
      success: false,
      message: "No heart rate records found for this trainee.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Last heart rate record retrieved successfully.",
    data: lastHeartRateRecord,
  });
});

const getWeeklyHeartRateRecords = catchAsyncError(async (req, res) => {
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

  // Get the heart rate records for the last 7 days for the trainee
  let heartRateRecords = await HeartRate.find({
    trainee: traineeId,
    createdAt: { $gte: sevenDaysAgo, $lte: today },
  }).sort({ createdAt: 1 });

  // Map records to ensure each day has the latest record
  const recordsMap = heartRateRecords.reduce((map, record) => {
    const adjustedCreatedAt = moment(record.createdAt).add(3, 'hours').toDate();
    const date = moment(adjustedCreatedAt).startOf('day').format("YYYY-MM-DD");
    if (!map[date] || moment(adjustedCreatedAt).isAfter(map[date].createdAt)) {
      map[date] = { bpm: record.bpm, createdAt: adjustedCreatedAt };
    }
    return map;
  }, {});

  // Fill in missing days with bpm: 0
  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const dateString = moment(date).startOf('day').format("YYYY-MM-DD");
    const record = recordsMap[dateString] || { bpm: 0, createdAt: moment(date).startOf('day').toISOString() };
    return {
      bpm: record.bpm,
      createdAt: moment(record.createdAt).toISOString(),
    };
  });

  res.status(200).json({
    success: true,
    message: "Heart rate records for the last 7 days retrieved successfully.",
    data: last7Days,
  });
});
export { recordHeartRate, getLastHeartRateRecord,getWeeklyHeartRateRecords };
