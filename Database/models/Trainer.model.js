import { Schema, model } from "mongoose";
import { SubscriptionModel } from "../models/subscription.model.js";

const trainerSchema = new Schema(
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
    //------------------------------------------------------------------------------------
    profilePhoto: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "Profile photo is required.",
      ],
    },
    profilePhotoHash: {
      type: String,
      default: "",
    },
    nationalId: {
      type: Number,
      required: true,
    },

    country: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "Country is required.",
      ],
    },
    state: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "State is required.",
      ],
    },
    city: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "City is required.",
      ],
    },
    phoneNumber: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "Phone Number is required.",
      ],
    },
    birthDate: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "Birth Date is required.",
      ],
    },
    biography: {
      type: String,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "Biography is required.",
      ],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female"],
      default: "Male",
    },
    //----------------------------------------------------------------------------------------------

    specializations: [
      {
        value: {
          type: String,
          default: "",
        },
        label: {
          type: String,
          default: "",
        },
      },
    ],
    yearsOfExperience: {
      type: Number,
      required: [
        function () {
          return this.status !== "incomplete";
        },
        "Years of experience is required.",
      ],
      min: [0, "Years of experience cannot be negative."],
    },
    // qualificationsAndAchievements: [
    //   {
    //     photo: {
    //       type: String,
    //       required: [
    //         function () {
    //           return this.status !== "incomplete";
    //         },
    //         "Photo is required for qualifications and achievements.",
    //       ],
    //     },
    //   },
    // ],
    // qualificationsAndAchievements: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "QualificationAndAchievement",
    //   },
    // ],
    socialMedia: {
      facebook: { type: String, default: "" },
      X: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    //----------------------------------------------------------------------------
    traniee: [
      {
        type: Schema.ObjectId,
        ref: "Trainee",
      },
    ],
    // subscribers: {
    //   type: Number,
    //   default: 0,
    // },
    //--------------------------------------------------------------------------
    status: {
      type: String,
      enum: ["incomplete", "pending", "accepted", "rejected", "blocked"],
      default: "incomplete",
    },
    acceptPolicy: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      default: "trainer",
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
    qualificationsAndAchievements: [
      {
        type: Schema.Types.ObjectId,
        ref: "QualificationAndAchievement",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// trainerSchema.add({
//   qualificationsAndAchievements: [
//     {
//       type: Schema.Types.ObjectId,
//       ref: "QualificationAndAchievement",
//     },
//   ],
// });

// trainerSchema.pre("findById", function () {
//   this.populate("qualificationsAndAchievements");
// });

// const BASE_FILE_URL = "http://localhost:4000/";
// trainerSchema.post("init", function (doc) {
//   if (doc.profilePhoto && !doc.profilePhoto.startsWith(BASE_FILE_URL)) {
//     const pathParts = doc.profilePhoto.split("\\").slice(-4);
//     doc.profilePhoto =
//       BASE_FILE_URL + "uploads/" + pathParts.join("/").replace(/\s/g, "%20");
//   }
// });

// Virtual field to indicate if the trainer is a favorite
trainerSchema.virtual("isFavorite", {
  ref: "Favorite",
  localField: "_id",
  foreignField: "trainer",
  justOne: false, // Set to false because one trainer can be favorited by many trainees
  count: true, // Only get the number of documents that match
});

// trainerSchema.virtual("activeSubscribers").get(function () {
//   if (!this._id) return 0; // Ensure there's an ID to query against

//   return SubscriptionModel.countDocuments({
//     trainerId: this._id,
//     status: "Active",
//   }).exec();
// });

// trainerSchema.set("toJSON", { virtuals: true });
// trainerSchema.set("toObject", { virtuals: true });

// trainerSchema.methods.fetchActiveSubscribers = async function () {
//   if (!this._id) return 0;
//   return await SubscriptionModel.countDocuments({
//     trainerId: this._id,
//     status: "Active",
//   });
// };
trainerSchema.methods.fetchActiveSubscribers = async function () {
  if (!this._id) return 0;
  const results = await SubscriptionModel.aggregate([
    {
      $match: {
        trainerId: this._id,
        status: "Active",
      },
    },
    {
      $group: {
        _id: "$traineeId",
      },
    },
    {
      $count: "distinctTrainees",
    },
  ]);
  return results.length > 0 ? results[0].distinctTrainees : 0;
};
export const trainerModel = model("Trainer", trainerSchema);
