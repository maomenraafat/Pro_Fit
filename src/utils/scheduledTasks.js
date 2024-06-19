// import { CronJob } from "cron";
// import { traineeModel } from "../../Database/models/Trainee.model.js";
// import { StepRecord } from "./../../Database/models/stepRecord.model.js";

// // Function to reset daily steps and calories for all trainees
// const resetDailyStepsAndCalories = async () => {
//   const resetDate = new Date();
//   resetDate.setHours(0, 0, 0, 0);

//   try {
//     const trainees = await traineeModel.find({ role: "trainee" }).select("_id");
//     const operations = trainees.map((trainee) => ({
//       updateOne: {
//         filter: { trainee: trainee._id, date: resetDate },
//         update: { $set: { steps: 0, calories: 0 } },
//         upsert: true,
//       },
//     }));

//     if (operations.length > 0) {
//       await StepRecord.bulkWrite(operations);
//       console.log(
//         `Reset daily steps and calories for ${operations.length} trainees.`
//       );
//     } else {
//       console.log("No trainee steps or calories to reset.");
//     }
//   } catch (error) {
//     console.error("Error resetting daily steps and calories:", error);
//   }
// };

// // Cron job to run the reset function at midnight Cairo time (UTC+3)
// const job = new CronJob(
//   "0 0 * * *",
//   resetDailyStepsAndCalories,
//   null,
//   true,
//   "Africa/Cairo"
// );

// // Start the cron job
// job.start();

// console.log(
//   "Cron job scheduled: Reset steps and calories at midnight Cairo time."
// );
