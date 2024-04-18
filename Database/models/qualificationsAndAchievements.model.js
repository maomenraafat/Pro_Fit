import { Schema, model } from "mongoose";

const QualificationAndAchievementSchema = new Schema({
  photo: {
    type: String,
    required: [
      function () {
        return this.status !== "incomplete";
      },
      "Photo is required for qualifications and achievements.",
    ],
  },
  trainer: {
    type: Schema.Types.ObjectId,
    ref: "Trainer",
  },
});
// const BASE_FILE_URL = "http://localhost:4000/";

// QualificationAndAchievementSchema.post("init", function (doc) {
//   if (
//     doc.photo &&
//     doc.photo.length > 0 &&
//     !doc.photo.startsWith(BASE_FILE_URL)
//   ) {
//     const pathParts = doc.photo.split("\\").slice(-4);
//     doc.photo =
//       BASE_FILE_URL + "uploads/" + pathParts.join("/").replace(/\s/g, "%20");
//   }
// });

export const QualificationAndAchievementModel = model(
  "QualificationAndAchievement",
  QualificationAndAchievementSchema
);
