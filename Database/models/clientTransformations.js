import mongoose from "mongoose";
const { Schema, model } = mongoose;

const clientTransformationSchema = new Schema(
  {
    trainerId: {
      type: Schema.ObjectId,
      ref: "Trainer",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    beforeImage: {
      type: String,
      required: [true, "beforeImage  is required"],
    },
    afterImage: {
      type: String,
      required: [true, "afterImage  is required"],
    },
  },
  { timestamps: true }
);
// const BASE_FILE_URL = "http://localhost:4000/";

// clientTransformationSchema.post("init", function (doc) {
//   if (doc) {
//     if (
//       doc.beforeImage &&
//       doc.beforeImage.length > 0 &&
//       !doc.beforeImage.startsWith(BASE_FILE_URL)
//     ) {
//       const pathParts = doc.beforeImage.split("\\").slice(-4);
//       doc.beforeImage =
//         BASE_FILE_URL + "uploads/" + pathParts.join("/").replace(/\s/g, "%20");
//     }

//     if (
//       doc.afterImage &&
//       doc.afterImage.length > 0 &&
//       !doc.afterImage.startsWith(BASE_FILE_URL)
//     ) {
//       const pathParts = doc.afterImage.split("\\").slice(-4);
//       doc.afterImage =
//         BASE_FILE_URL + "uploads/" + pathParts.join("/").replace(/\s/g, "%20");
//     }
//   }
// });

export const ClientTransformationModel = model(
  "ClientTransformation",
  clientTransformationSchema
);
