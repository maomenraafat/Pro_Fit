
import { SleepTrack } from '../../../../../Database/models/sleepTrack.model.js';
import { catchAsyncError } from './../../../../utils/catchAsyncError.js';
import moment from 'moment-timezone';


const addSleepData = catchAsyncError(async (req, res) => {
  const { fallAsleepTime, wakeUpTime } = req.body;
  const traineeId = req.user.payload.id;
  const now = moment().tz("Africa/Cairo");
  const currentHour = now.hour();

  // This will check if the current time is evening and the sleep time is morning, implying next day
  const isNextDay = currentHour >= 12 && ["PM"].includes(now.format("A")) && ["AM"].includes(moment.tz(fallAsleepTime, "hh:mm A", "Africa/Cairo").format("A"));

  let parsedFallAsleepTime = moment.tz(`${fallAsleepTime}`, "hh:mm A", "Africa/Cairo");
  let parsedWakeUpTime = moment.tz(`${wakeUpTime}`, "hh:mm A", "Africa/Cairo");

  if (isNextDay) {
    parsedFallAsleepTime.add(1, 'days');
    parsedWakeUpTime.add(1, 'days');
  }

  if (!parsedFallAsleepTime.isValid() || !parsedWakeUpTime.isValid()) {
    return res.status(400).json({
      success: false,
      message: "Invalid time format. Please use 'hh:mm A' format.",
    });
  }

  if (parsedFallAsleepTime.isSameOrAfter(parsedWakeUpTime)) {
    parsedWakeUpTime.add(1, 'days'); // Adjusts the wake up time to the next day
  }

  const fallAsleepTimeDate = parsedFallAsleepTime.toDate();
  const wakeUpTimeDate = parsedWakeUpTime.toDate();
  const dateRecorded = now.toDate(); // Capture the current date and time, adjusted as needed

  const sleepData = await SleepTrack.create({
    trainee: traineeId,
    fallAsleepTime: fallAsleepTimeDate,
    wakeUpTime: wakeUpTimeDate,
    dateRecorded: dateRecorded
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
                                             .sort({ dateRecorded: -1 }) // Sort by date recorded in descending order
                                             .limit(1); // Limit to only one result
  
    if (!latestSleepData) {
      return res.status(404).json({
        success: false,
        message: "No sleep data found for this trainee."
      });
    }
  
    // Format the times and date for display
    const fallAsleepTime = moment(latestSleepData.fallAsleepTime).tz("Africa/Cairo").format("hh:mm A");
    const wakeUpTime = moment(latestSleepData.wakeUpTime).tz("Africa/Cairo").format("hh:mm A");
    const dateRecorded = moment(latestSleepData.dateRecorded).tz("Africa/Cairo").format("YYYY-MM-DD");
  
    // Calculate hours and minutes slept
    const duration = moment.duration(moment(latestSleepData.wakeUpTime).diff(moment(latestSleepData.fallAsleepTime)));
    const hoursSlept = `${duration.hours()} hrs ${duration.minutes()} mins`;
  
    // Return the formatted data
    res.status(200).json({
      success: true,
      message: "Latest sleep data retrieved successfully.",
      data: {
        _id: latestSleepData._id,
        hoursSlept,
        fallAsleepTime,
        wakeUpTime,
        dateRecorded
      }
    });
  });

const getSleepData = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  // Retrieve sleep data from the database
  const sleepData = await SleepTrack.find({ trainee: traineeId }).sort({ dateRecorded: -1 });

  // Get the current date in Egypt's timezone
  const today = moment().tz("Africa/Cairo").startOf('day');

  // Map through each data entry to format it and determine the relative day
  const formattedSleepData = sleepData.map(data => {
    // Format times without the date part
    const fallAsleepTime = moment(data.fallAsleepTime).tz("Africa/Cairo").format("hh:mm A");
    const wakeUpTime = moment(data.wakeUpTime).tz("Africa/Cairo").format("hh:mm A");
    const dateRecorded = moment(data.dateRecorded).tz("Africa/Cairo").format("YYYY-MM-DD");

    // Calculate hours and minutes slept taking into account timezone
    const duration = moment.duration(moment(data.wakeUpTime).diff(moment(data.fallAsleepTime)));
    const hoursSlept = `${duration.hours()} hrs ${duration.minutes()} mins`;

    return {
      _id: data._id,
      hoursSlept,
      fallAsleepTime,
      wakeUpTime,
      dateRecorded
    };
  });

  res.status(200).json({
    success: true,
    message: "Sleep data retrieved successfully.",
    data: formattedSleepData,
  });
});



  

  export{
    addSleepData,
    getLatestSleepData,
    getSleepData
  }