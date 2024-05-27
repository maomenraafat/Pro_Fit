import mongoose from "mongoose";
const { Schema, model } = mongoose;

const subscriptionSchema = new Schema(
  {
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    traineeId: {
      type: Schema.Types.ObjectId,
      ref: "Trainee",
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    subscriptionType: {
      type: String,
    },
    duration: {
      type: Number,
    },
    paidAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Active", "Expired", "Pending", "Cancelled"],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    traineeSubscriptionStatus: {
      type: String,
      enum: ["Current", "Last", "Archived"],
      default: "Current",
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.pre("save", async function (next) {
  if (this.isModified("package") || this.isNew) {
    const packageData = await this.model("Package")
      .findById(this.package)
      .exec();
    if (packageData) {
      if (packageData.duration) {
        this.duration = packageData.duration;
        this.paidAmount = packageData.price;
        this.endDate = new Date(this.startDate.getTime());
        this.endDate.setMonth(this.startDate.getMonth() + packageData.duration);
      }
      if (packageData.packageType) {
        this.subscriptionType = packageData.packageType;
      }
    }
  }
  if (this.endDate && this.endDate < new Date()) {
    this.status = "Expired";
  }
  next();
});

export const SubscriptionModel = model("Subscription", subscriptionSchema);
