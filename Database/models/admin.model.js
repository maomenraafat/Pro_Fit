import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
const adminSchema = new Schema(
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
    profilePhoto: {
      type: String,
      default: "",
    },
    profilePhotoHash: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export const adminModel = model("Admin", adminSchema);
