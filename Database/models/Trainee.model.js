import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { traineeDietAssessmentModel } from "./traineeDietAssessment.model.js";

const traineeSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Full Name is required."],
    },
    lastName: {
      type: String,
      required: [true, "Last Name is required."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    //--------------------------------------------------------------------------------------------------------------------------
    traineeBasicInfo: {
      type: Schema.ObjectId,
      ref: "traineeBasicInfo",
    },
    //-------------------------------------------------------------------------------------------------------------------------

    traineeWorkoutAssessment: {
      type: Schema.ObjectId,
      ref: "traineeWorkoutAssessment",
    },
    workoutAssessmentStatus: {
      type: String,
      enum: ["Ready", "In Preparation", "Work", "Pending", "Not Allowed"],
      default: "Not Allowed",
    },

    //-------------------------------------------------------------------------------------------------------------------------

    traineeDietAssessment: {
      type: Schema.ObjectId,
      ref: "traineeDietAssessment",
    },
    dietAssessmentStatus: {
      type: String,
      enum: ["Ready", "In Preparation", "Working", "Pending", "Not Allowed"],
      default: "Not Allowed",
    },

    //-------------------------------------------------------------------------------------------------------------------------

    assignedTrainer: {
      type: Schema.ObjectId,
      ref: "Trainer",
      default: null,
    },
    package: {
      type: Schema.ObjectId,
      ref: "Package",
      default: null,
    },

    //-------------------------------------------------------------------------------------------------------------------------
    profilePhoto: {
      type: String,
      default:
        "https://asset.cloudinary.com/dbpvx37nc/fa534bec3c11074c407903bcaabffad5",
    },
    profilePhotoId: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    religion: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    stepGoal: {
      type: Number,
      default: 10000,
    },
    waterGoal: {
      type: Number,
      default: 2000,
    },
    role: {
      type: String,
      // enum: ["admin", "trainee"],
      default: "trainee",
    },
    status: {
      type: String,
      enum: ["non-subscriber", "subscriber", "banned", "blocked"],
      default: "non-subscriber",
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    OTP: {
      type: String,
      default: null,
    },
    OTPExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

traineeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

traineeSchema.pre("save", async function (next) {
  // Check if the profile photo was modified and it's not the default photo
  if (
    this.isModified("profilePhoto") &&
    this.profilePhoto !==
      "https://asset.cloudinary.com/dbpvx37nc/fa534bec3c11074c407903bcaabffad5"
  ) {
  }

  next();
});

traineeSchema.methods.setCurrentDietAssessment = async function () {
  const TraineeDietAssessment = this.model("traineeDietAssessment");
  const currentAssessment = await traineeDietAssessmentModel.findOne({
    trainee: this._id,
    status: "Current",
  });
  if (currentAssessment) {
    this.traineeDietAssessment = currentAssessment._id;
    await this.save();
    return this.traineeDietAssessment;
  }
  //else {
  //   throw new Error("No current diet assessment found for this trainee.");
  // }
};

export const traineeModel = model("Trainee", traineeSchema);
