import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

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

    traineeWorkoutAssesment: {
      type: Schema.ObjectId,
      ref: "traineeWorkoutAssesment",
    },

    //-------------------------------------------------------------------------------------------------------------------------

    traineeDietAssesment: {
      type: Schema.ObjectId,
      ref: "traineeDietAssesment",
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
      default: "",
    },
    mobile: {
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
    role: {
      type: String,
      enum: ["admin", "trainee"],
      default: "trainee",
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

export const traineeModel = model("Trainee", traineeSchema);
