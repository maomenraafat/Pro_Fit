
import { traineeModel } from '../../../../../Database/models/Trainee.model.js';
import { WaterRecord } from '../../../../../Database/models/waterIntake.model.js';
import { catchAsyncError } from './../../../../utils/catchAsyncError.js';

const setWaterGoal = catchAsyncError(async (req, res) => {
    const traineeId = req.user.payload.id;
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

    trainee.waterGoal = waterGoal;
    await trainee.save();

    res.status(201).json({
        success: true,
        message: "Water goal set successfully.",
        data: waterGoal 
    });
});

const recordWaterIntake = catchAsyncError(async (req, res) => {
    const traineeId = req.user.payload.id;
    const { amount = 250 } = req.body; 

    // Create a new date object for the current time and adjust to Egypt's time zone
    const date = new Date();
    date.setHours(date.getHours() + 3); 
    date.setUTCHours(0, 0, 0, 0);

    // Fetch the trainee to get the water goal
    const trainee = await traineeModel.findById(traineeId);
    if (!trainee) {
        return res.status(404).json({
            success: false,
            message: "Trainee not found.",
        });
    }

    // Fetch the existing water record for today, or prepare to create a new one
    const waterRecord = await WaterRecord.findOne({
        trainee: traineeId,
        date,
    });

    if (waterRecord) {
        // Calculate the new intake amount
        const newIntake = waterRecord.intake + amount;
        if (newIntake > trainee.waterGoal) {
            return res.status(400).json({
                success: false,
                message: "Adding this amount would exceed your daily water goal.",
            });
        }
        waterRecord.intake = newIntake;
        await waterRecord.save();
    } else {
        // Check if the first entry itself exceeds the goal
        if (amount > trainee.waterGoal) {
            return res.status(400).json({
                success: false,
                message: "Adding this amount would exceed your daily water goal.",
            });
        }
        // Create a new record if no intake has been recorded today
        await WaterRecord.create({
            trainee: traineeId,
            date,
            intake: amount,
        });
    }

    res.status(201).json({
        success: true,
        message: "Water intake recorded successfully.",
    });
});

const getTodayWaterIntake = catchAsyncError(async (req, res) => {
    const traineeId = req.user.payload.id;
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    const todayRecord = await WaterRecord.findOne({
        trainee: traineeId,
        date
    }) || { intake: 0 };

    const trainee = await traineeModel.findById(traineeId);
    const waterGoal = trainee.waterGoal
    const percentageComplete = parseInt(((todayRecord.intake / waterGoal) * 100).toFixed(2));

    res.status(200).json({
        success: true,
        message: "Today's water intake fetched successfully.",
        data: {
            intake: todayRecord.intake,
            goal: waterGoal,
            percentageComplete
        }
    });
});

const fillAll = catchAsyncError(async (req, res) => {
    const traineeId = req.user.payload.id;
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    const trainee = await traineeModel.findById(traineeId);
    if (!trainee || !trainee.waterGoal) {
        return res.status(404).json({
            success: false,
            message: "Trainee not found or water goal not set.",
        });
    }

    // Update or create a record to match the trainee's water goal
    const updatedRecord = await WaterRecord.findOneAndUpdate(
        { trainee: traineeId, date },
        { $set: { intake: trainee.waterGoal } },
        { new: true, upsert: true }
    );

    res.status(200).json({
        success: true,
        message: "Daily water intake filled to meet the goal.",
        data: { intake: updatedRecord.intake }
    });
});

const resetIntake = catchAsyncError(async (req, res) => {
    const traineeId = req.user.payload.id;
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    // Update or create a record to set the intake to zero
    const updatedRecord = await WaterRecord.findOneAndUpdate(
        { trainee: traineeId, date },
        { $set: { intake: 0 } },
        { new: true, upsert: true }
    );

    res.status(200).json({
        success: true,
        message: "Daily water intake has been reset.",
        data: { intake: updatedRecord.intake }
    });
});

export{
    setWaterGoal,
    recordWaterIntake,
    getTodayWaterIntake,
    fillAll,
    resetIntake,
}