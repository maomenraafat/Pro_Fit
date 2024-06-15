import { PackageModel } from "../../Database/models/Package.model.js";
import { nutritionModel } from "../../Database/models/nutrition.model.js";
import { reviewModel } from "../../Database/models/review.model.js";
import { SubscriptionModel } from "../../Database/models/subscription.model.js";

class Dashboard {
  constructor(trainerId) {
    this.trainerId = trainerId;
  }

  async getTotalSubscriptions() {
    return await SubscriptionModel.countDocuments({
      trainerId: this.trainerId,
    });
  }

  async getSubscriptionsByStatus(status) {
    return await SubscriptionModel.countDocuments({
      trainerId: this.trainerId,
      status: status,
    });
  }

  async getSubscriptionsStatusCounts() {
    const activeCount = await this.getSubscriptionsByStatus("Active");
    const cancelledCount = await this.getSubscriptionsByStatus("Cancelled");
    const expiredCount = await this.getSubscriptionsByStatus("Expired");

    return {
      active: activeCount,
      cancelled: cancelledCount,
      expired: expiredCount,
    };
  }

  async getTotalTrainees() {
    return await SubscriptionModel.countDocuments({
      trainerId: this.trainerId,
      traineeSubscriptionStatus: "Current",
    });
  }

  async getTraineesByStatus(status) {
    return await SubscriptionModel.countDocuments({
      trainerId: this.trainerId,
      traineeSubscriptionStatus: "Current",
      status: status,
    });
  }

  async getTraineesStatusCounts() {
    const activeCount = await this.getTraineesByStatus("Active");
    const cancelledCount = await this.getTraineesByStatus("Cancelled");
    const expiredCount = await this.getTraineesByStatus("Expired");

    return {
      active: activeCount,
      cancelled: cancelledCount,
      expired: expiredCount,
    };
  }

  async getPackagesWithSubscriptions() {
    const packages = await PackageModel.find({ trainerId: this.trainerId });
    let total = 0;
    const packagesWithDetails = await Promise.all(
      packages.map(async (pkg) => {
        const subscriptionCounts = await SubscriptionModel.aggregate([
          {
            $match: {
              package: pkg._id,
            },
          },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const defaultCounts = {
          active: 0,
          expired: 0,
          cancelled: 0,
        };

        const subscriptionDetails = subscriptionCounts.reduce(
          (acc, { _id, count }) => {
            acc[_id.toLowerCase()] = count;
            return acc;
          },
          defaultCounts
        );
        const value =
          subscriptionDetails.active +
          subscriptionDetails.expired +
          subscriptionDetails.cancelled;

        total += value;

        return {
          label: pkg.packageName,
          value,
          active: subscriptionDetails.active,
          expired: subscriptionDetails.expired,
          cancelled: subscriptionDetails.cancelled,
        };
      })
    );

    return {
      total,
      details: packagesWithDetails,
    };
  }

  // async getPackagesWithSubscriptions() {
  //   const packages = await PackageModel.find({ trainerId: this.trainerId });
  //   let allSubscriptions = 0;
  //   const packagesWithDetails = await Promise.all(
  //     packages.map(async (pkg) => {
  //       const subscriptionCounts = await SubscriptionModel.aggregate([
  //         {
  //           $match: {
  //             package: pkg._id /* traineeSubscriptionStatus: "Current"*/,
  //           },
  //         },
  //         { $group: { _id: "$status", count: { $sum: 1 } } },
  //       ]);

  //       const defaultCounts = {
  //         activeSubscriptions: 0,
  //         expiredSubscriptions: 0,
  //         cancelledSubscriptions: 0,
  //       };

  //       const subscriptionDetails = subscriptionCounts.reduce(
  //         (acc, { _id, count }) => {
  //           acc[`${_id.toLowerCase()}Subscriptions`] = count;
  //           return acc;
  //         },
  //         defaultCounts
  //       );
  //       const totalSubscriptions =
  //         subscriptionDetails.activeSubscriptions +
  //         subscriptionDetails.expiredSubscriptions +
  //         subscriptionDetails.cancelledSubscriptions;

  //       allSubscriptions += totalSubscriptions;

  //       return {
  //         packageName: pkg.packageName,
  //         packageId: pkg._id,
  //         packageType: pkg.packageType,
  //         active: pkg.active,
  //         totalSubscriptions,
  //         ...subscriptionDetails,
  //       };
  //     })
  //   );

  //   return {
  //     packagesCount: packages.length,
  //     allSubscriptions,
  //     packages: packagesWithDetails,
  //   };
  // }

  async getAllSubscriptionsDate() {
    const subscriptions = await SubscriptionModel.find({
      trainerId: this.trainerId,
    });

    return subscriptions.map((sub) => ({
      status: sub.status,
      startDate: sub.startDate,
    }));
  }

  async getAllSubscriptionsByStartDate() {
    const subscriptionsByDate = await SubscriptionModel.aggregate([
      { $match: { trainerId: this.trainerId } },
      {
        $group: {
          _id: {
            $dateToString: { /*format: "%Y-%m-%d",*/ date: "$startDate" },
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

  // async getAllSubscriptionsByStartDate() {
  //   const subscriptionsByDate = await SubscriptionModel.aggregate([
  //     { $match: { trainerId: this.trainerId } },
  //     {
  //       $group: {
  //         _id: {
  //           $dateToString: { format: "%Y-%m-%d", date: "$startDate" },
  //         },
  //         count: { $sum: 1 },
  //       },
  //     },
  //     { $sort: { _id: 1 } },
  //   ]);

  //   return subscriptionsByDate.map((sub) => ({
  //     startDate: sub._id,
  //     count: sub.count,
  //   }));
  // }

  // async countActiveTraineesWithReadyDietAssessment() {
  //   const result = await SubscriptionModel.aggregate([
  //     {
  //       $match: {
  //         trainerId: this.trainerId, // Match subscriptions for the trainer
  //         status: "Active", // Ensure the subscription is active
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "trainees", // Assumes 'trainees' is the correct collection name
  //         localField: "traineeId",
  //         foreignField: "_id",
  //         as: "traineeDetails",
  //       },
  //     },
  //     { $unwind: "$traineeDetails" }, // Unwind the array to flatten it
  //     {
  //       $match: {
  //         "traineeDetails.dietAssessmentStatus": "Ready",
  //       },
  //     },
  //     {
  //       $count: "totalReadyTrainees", // Count the results
  //     },
  //   ]);

  //   // Return the count or 0 if no such trainees exist
  //   return result.length > 0 ? result[0].totalReadyTrainees : 0;
  // }

  async countActiveTraineesWithReadyDietAssessment() {
    const result = await SubscriptionModel.aggregate([
      {
        $match: {
          trainerId: this.trainerId,
          status: "Active",
        },
      },
      {
        $lookup: {
          from: "trainees",
          localField: "traineeId",
          foreignField: "_id",
          as: "traineeDetails",
        },
      },
      { $unwind: "$traineeDetails" },
      {
        $match: {
          "traineeDetails.dietAssessmentStatus": "Ready",
        },
      },
      {
        $lookup: {
          from: "traineedietassessments",
          let: { trainee: "$traineeDetails._id" },
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
          as: "currentDietAssessment",
        },
      },
      {
        $project: {
          _id: 0,
          traineeId: "$traineeDetails._id",
          firstName: "$traineeDetails.firstName",
          lastName: "$traineeDetails.lastName",
          email: "$traineeDetails.email",
          profilePhoto: "$traineeDetails.profilePhoto",
          dietAssessmentStatus: "$traineeDetails.dietAssessmentStatus",
          currentDietAssessmentCreatedAt: {
            $arrayElemAt: ["$currentDietAssessment.createdAt", 0],
          },
        },
      },
    ]);

    return {
      count: result.length,
      trainees: result,
    };
  }

  async countActiveTraineesWithReadyWorkoutAssessment() {
    const result = await SubscriptionModel.aggregate([
      {
        $match: {
          trainerId: this.trainerId,
          status: "Active",
        },
      },
      {
        $lookup: {
          from: "trainees",
          localField: "traineeId",
          foreignField: "_id",
          as: "traineeDetails",
        },
      },
      { $unwind: "$traineeDetails" },
      {
        $match: {
          "traineeDetails.workoutAssessmentStatus": "Ready",
        },
      },
      {
        $lookup: {
          from: "traineeworkoutassessments",
          let: { trainee: "$traineeDetails._id" },
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
          as: "currentWorkoutAssessment",
        },
      },
      {
        $project: {
          _id: 0,
          traineeId: "$traineeDetails._id",
          firstName: "$traineeDetails.firstName",
          lastName: "$traineeDetails.lastName",
          email: "$traineeDetails.email",
          profilePhoto: "$traineeDetails.profilePhoto",
          workoutAssessmentStatus: "$traineeDetails.workoutAssessmentStatus",
          currentWorkoutAssessmentCreatedAt: {
            $arrayElemAt: ["$currentWorkoutAssessment.createdAt", 0],
          },
        },
      },
    ]);

    return {
      count: result.length,
      trainees: result,
    };
  }

  async getTotalPaidAmount(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await SubscriptionModel.aggregate([
      {
        $match: {
          trainerId: this.trainerId,
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

  async getTotalNutritionPlans(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const count = await nutritionModel.countDocuments({
      trainer: this.trainerId,
      createdAt: { $gte: startDate },
      plantype: { $in: ["Customized plan", "Free plan"] },
    });

    return count;
  }

  // async getTotalWorkoutPlans(days) {
  //   const startDate = new Date();
  //   startDate.setDate(startDate.getDate() - days);

  //   const count = await WorkoutPlanModel.countDocuments({
  //     trainer: this.trainerId,
  //     createdAt: { $gte: startDate },
  //     planType: { $in: ["Customized plan", "Free plan"] },
  //   });

  //   return count;
  // }

  async getAverageRating() {
    const reviews = await reviewModel.find({ trainer: this.trainerId });
    if (reviews.length === 0) {
      return 0;
    }
    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    return averageRating;
  }
}

export default Dashboard;
