import { SubscriptionModel } from "../../Database/models/subscription.model.js";
import { trainerModel } from "../../Database/models/Trainer.model.js";
//import { ExerciseModel } from "../../Database/models/exercise.model.js";
import { foodModel } from "../../Database/models/food.model.js";
import { traineeModel } from "../../Database/models/Trainee.model.js";

class AdminDashboard {
  constructor(days) {
    this.days = days;
  }

  getStartDate() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.days);
    return startDate;
  }
  /*performanceMetrics*/
  async getTotalPaidAmount() {
    const startDate = this.getStartDate();
    const result = await SubscriptionModel.aggregate([
      {
        $match: {
          status: { $in: ["Active", "Expired"] },
          startDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidAmount: { $sum: "$paidAmount" },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalPaidAmount : 0;
  }
  async getTotalExercises() {
    const startDate = this.getStartDate();
    return await ExerciseModel.countDocuments({
      Trainer: null,
      createdAt: { $gte: startDate },
    });
  }
  async getTotalFoods() {
    const startDate = this.getStartDate();
    return await foodModel.countDocuments({
      Trainer: null,
      createdAt: { $gte: startDate },
    });
  }
  async getTotalPendingTrainers() {
    const startDate = this.getStartDate();
    return await trainerModel.countDocuments({
      status: "pending",
      // createdAt: { $gte: startDate },
    });
  }
  /*DashboardData*/
  async getCountOfSystemUsers() {
    const totalCounts = await this.getTotalCounts();
    const { totalTrainers, totalTrainees } = totalCounts;

    const ChartData = {
      total: totalTrainers + totalTrainees,
      details: [
        {
          users: "trainers",
          value: totalTrainers,
        },
        {
          users: "trainees",
          value: totalTrainees,
        },
      ],
    };

    return ChartData;
  }
  async getTrainerStatusCounts() {
    const statuses = [
      "incomplete",
      "pending",
      "accepted",
      "rejected",
      "blocked",
    ];
    const result = await trainerModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const totalTrainers = await trainerModel.countDocuments({});

    return {
      total: totalTrainers,
      details: statuses.map((status) => ({
        status,
        value: counts[status] || 0,
      })),
    };
  }
  async getTraineeStatusCounts() {
    const statuses = ["non-subscriber", "subscriber", "banned", "blocked"];
    const result = await traineeModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const totalTrainees = await traineeModel.countDocuments({});

    return {
      total: totalTrainees,
      details: statuses.map((status) => ({
        status,
        value: counts[status] || 0,
      })),
    };
  }
  /**/
  async getAllSubscriptionsByStartDate() {
    const subscriptionsByDate = await SubscriptionModel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { /* format: "%Y-%m-%d", */ date: "$startDate" },
          },
          totalPaidAmount: { $sum: "$paidAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return subscriptionsByDate.map((sub) => ({
      startDate: sub._id,
      totalPaidAmount: sub.totalPaidAmount,
    }));
  }

  // async getTrainerStatusCounts() {
  //   const result = await trainerModel.aggregate([
  //     {
  //       $group: {
  //         _id: "$status",
  //         count: { $sum: 1 },
  //       },
  //     },
  //   ]);

  //   const totalTrainers = await trainerModel.countDocuments({});

  //   return {
  //     totalTrainers,
  //     statuses: result.map((item) => ({ status: item._id, value: item.count })),
  //   };
  // }
  // async getTraineeStatusCounts() {
  //   const result = await traineeModel.aggregate([
  //     {
  //       $group: {
  //         _id: "$status",
  //         count: { $sum: 1 },
  //       },
  //     },
  //   ]);

  //   const totalTrainees = await traineeModel.countDocuments({});

  //   return {
  //     totalTrainees,
  //     statuses: result.map((item) => ({ status: item._id, value: item.count })),
  //   };
  // }
  async getTotalCounts() {
    const totalTrainers = await trainerModel.countDocuments({});
    const totalTrainees = await traineeModel.countDocuments({});

    return { totalTrainers, totalTrainees };
  }
}

export default AdminDashboard;
