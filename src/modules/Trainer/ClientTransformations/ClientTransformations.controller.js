import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { AppError } from "../../../utils/AppError.js";
import { determineFolderName } from "../../../multer/multer.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";

// Updated to handle different image types, not just profile photos.
// async function handleImageUpload(trainer, file, imageType) {
//   // Ensure imageType is correctly defined to map to "ClientTransformations"
//   const validImageTypes = ["beforeImage", "afterImage"];
//   if (!validImageTypes.includes(imageType)) {
//     console.error("Invalid image type");
//     return null;
//   }

//   const folderName = determineFolderName(
//     { user: trainer },
//     "beforeImage",
//     "afterImage"
//     //imageType
//   );
//   const existingImageHash = trainer[imageType + "Hash"]; // Use a dynamic property based on imageType

//   const uploadResult = await uploadImageToCloudinary(
//     file,
//     folderName,
//     existingImageHash
//   );
//   if (uploadResult) {
//     return {
//       [imageType]: uploadResult.url, // Store the URL under a dynamic key based on imageType
//       [imageType + "Hash"]: uploadResult.hash, // Store the hash under a dynamic key
//     };
//   }

//   return null;
// }
async function handleImageUpload(trainer, file, imageType) {
  // Ensure imageType is correctly defined to map to "ClientTransformations"
  const validImageTypes = ["beforeImage", "afterImage"];
  if (!validImageTypes.includes(imageType)) {
    console.error("Invalid image type");
    return null;
  }

  // Use the imageType to determine the correct folder name
  const folderName = determineFolderName(
    { user: { payload: trainer } },
    imageType
  );
  const existingImageHash = trainer[imageType + "Hash"]; // Use a dynamic property based on imageType

  const uploadResult = await uploadImageToCloudinary(
    file,
    folderName,
    existingImageHash
  );
  if (uploadResult) {
    return {
      [imageType]: uploadResult.url, // Store the URL under a dynamic key based on imageType
      [imageType + "Hash"]: uploadResult.hash, // Store the hash under a dynamic key
    };
  }

  return null;
}

// const addClientTransformations = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const { title, description } = req.body;
//   const data = { trainerId, title, description };

//   // Handle beforeImage upload
//   if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
//     const file = req.files["beforeImage"][0];
//     const folderName = determineFolderName(req, "beforeImage");
//     const fileName = file.filename;

//     const result = await cloudinary.uploader
//       .upload(file.path, {
//         folder: folderName,
//         public_id: fileName.replace(/\.jpeg|\.jpg|\.png|\.gif/, ""),
//         resource_type: "auto",
//       })
//       .catch((error) => {
//         console.error("Upload failed:", error);
//         next(
//           new AppError(
//             "Failed to upload beforeImage to Cloudinary: " + error.message,
//             500
//           )
//         );
//         return null;
//       });

//     if (result) {
//       data.beforeImage = result.secure_url;
//       fs.unlinkSync(file.path);
//     }
//   }

//   // Handle afterImage upload
//   if (req.files["afterImage"] && req.files["afterImage"][0]) {
//     const file = req.files["afterImage"][0];
//     const folderName = determineFolderName(req, "afterImage");
//     const fileName = file.filename;

//     const result = await cloudinary.uploader
//       .upload(file.path, {
//         folder: folderName,
//         public_id: fileName.replace(/\.jpeg|\.jpg|\.png|\.gif/, ""),
//         resource_type: "auto",
//       })
//       .catch((error) => {
//         console.error("Upload failed:", error);
//         next(
//           new AppError(
//             "Failed to upload afterImage to Cloudinary: " + error.message,
//             500
//           )
//         );
//         return null;
//       });

//     if (result) {
//       data.afterImage = result.secure_url;
//       fs.unlinkSync(file.path);
//     }
//   }

//   const transformation = new ClientTransformationModel(data);
//   await transformation.save();

//   res.status(201).json({
//     success: true,
//     message: "Transformation saved successfully",
//     transformation,
//   });
// });
// const addClientTransformations = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const { title, description } = req.body;
//   let data = { trainerId, title, description }; // Initialize data here

//   // Handle beforeImage upload
//   if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
//     const file = req.files["beforeImage"][0];
//     const imageUploadResult = await handleImageUpload(
//       req.user.payload,
//       file,
//       "beforeImage"
//     );
//     if (imageUploadResult) {
//       data = { ...data, ...imageUploadResult };
//     }
//   }

//   // Handle afterImage upload
//   if (req.files["afterImage"] && req.files["afterImage"][0]) {
//     const file = req.files["afterImage"][0];
//     const imageUploadResult = await handleImageUpload(
//       req.user.payload,
//       file,
//       "afterImage"
//     );
//     if (imageUploadResult) {
//       data = { ...data, ...imageUploadResult };
//     }
//   }

//   const transformation = new ClientTransformationModel(data);
//   await transformation.save();

//   res.status(201).json({
//     success: true,
//     message: "Transformation saved successfully",
//     transformation,
//   });
// });
// const addClientTransformations = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const { title, description } = req.body;
//   let data = { trainerId, title, description };

//   // Ensure trainer exists
//   const trainer = await trainerModel.findById(trainerId);
//   if (!trainer) {
//     return next(new Error("Trainer not found"));
//   }

//   // Handle beforeImage upload
//   if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
//     const file = req.files["beforeImage"][0];
//     const imageUploadResult = await handleImageUpload(
//       trainer, // Pass the trainer object, not req.user.payload
//       file,
//       "beforeImage"
//     );
//     if (imageUploadResult) {
//       data = { ...data, ...imageUploadResult };
//     }
//   }

//   // Handle afterImage upload
//   if (req.files["afterImage"] && req.files["afterImage"][0]) {
//     const file = req.files["afterImage"][0];
//     const imageUploadResult = await handleImageUpload(
//       trainer, // Pass the trainer object, not req.user.payload
//       file,
//       "afterImage"
//     );
//     if (imageUploadResult) {
//       data = { ...data, ...imageUploadResult };
//     }
//   }

//   const transformation = new ClientTransformationModel(data);
//   await transformation.save();

//   res.status(201).json({
//     success: true,
//     message: "Transformation saved successfully",
//     transformation,
//   });
// });
const addClientTransformations = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const { title, description } = req.body;
  let data = { trainerId, title, description };

  // Ensure trainer exists
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) {
    return next(new Error("Trainer not found"));
  }

  // Handle beforeImage upload
  if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
    const file = req.files["beforeImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer,
      file,
      "beforeImage"
    );
    if (imageUploadResult) {
      // Use dynamic keys based on imageType
      data.beforeImage = imageUploadResult.beforeImage;
      data.beforeImageHash = imageUploadResult.beforeImageHash;
    }
  }

  // Handle afterImage upload
  if (req.files["afterImage"] && req.files["afterImage"][0]) {
    const file = req.files["afterImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer,
      file,
      "afterImage"
    );
    if (imageUploadResult) {
      // Use dynamic keys based on imageType
      data.afterImage = imageUploadResult.afterImage;
      data.afterImageHash = imageUploadResult.afterImageHash;
    }
  }

  // Create and save the ClientTransformation document
  const transformation = new ClientTransformationModel(data);
  await transformation.save();

  // Send success response
  res.status(201).json({
    success: true,
    message: "Transformation saved successfully",
    transformation,
  });
});

const getClientTransformations = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const data = await ClientTransformationModel.find({
    trainerId: id,
  });
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(201).json({
    success: true,
    data,
  });
});
const getspecificClientTransformations = catchAsyncError(
  async (req, res, next) => {
    const trainerId = req.user.payload.id;
    const transformationId = req.params.id;
    const transformation = await ClientTransformationModel.findOne({
      _id: transformationId,
      trainerId: trainerId,
    });

    if (!transformation) {
      return next(new AppError("data not found", 404));
    }
    res.status(200).json({
      success: true,
      data: transformation,
    });
  }
);

// const updateClientTransformation = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const transformationId = req.params.id;
//   const { title, description } = req.body;
//   let updateData = { title, description };

//   // Update beforeImage
//   if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
//     const file = req.files["beforeImage"][0];
//     const folderName = determineFolderName(req, "beforeImage");
//     const fileName = file.filename;

//     const result = await cloudinary.uploader
//       .upload(file.path, {
//         folder: folderName,
//         public_id: fileName.replace(/\.jpeg|\.jpg|\.png|\.gif/, ""),
//         resource_type: "auto",
//       })
//       .catch((error) => {
//         console.error("Upload failed:", error);
//         next(
//           new AppError(
//             "Failed to upload beforeImage to Cloudinary: " + error.message,
//             500
//           )
//         );
//         return null;
//       });

//     if (result) {
//       updateData.beforeImage = result.secure_url;
//       fs.unlinkSync(file.path);
//     }
//   }

//   // Update afterImage
//   if (req.files["afterImage"] && req.files["afterImage"][0]) {
//     const file = req.files["afterImage"][0];
//     const folderName = determineFolderName(req, "afterImage");
//     const fileName = file.filename;

//     const result = await cloudinary.uploader
//       .upload(file.path, {
//         folder: folderName,
//         public_id: fileName.replace(/\.jpeg|\.jpg|\.png|\.gif/, ""),
//         resource_type: "auto",
//       })
//       .catch((error) => {
//         console.error("Upload failed:", error);
//         next(
//           new AppError(
//             "Failed to upload afterImage to Cloudinary: " + error.message,
//             500
//           )
//         );
//         return null;
//       });

//     if (result) {
//       updateData.afterImage = result.secure_url;
//       fs.unlinkSync(file.path);
//     }
//   }

//   const updatedTransformation =
//     await ClientTransformationModel.findOneAndUpdate(
//       { _id: transformationId, trainerId: trainerId },
//       updateData,

//       // The data to update
//       { new: true, runValidators: true }
//     );

//   if (!updatedTransformation) {
//     return next(new AppError("Transformation not found", 404));
//   }
//   res.status(200).json({
//     success: true,
//     message: "Transformation updated successfully",
//     data: updatedTransformation,
//   });
// });
////////////////////////////////////////////////////////////////
// const updateClientTransformation = catchAsyncError(async (req, res, next) => {
//   const trainerId = req.user.payload.id;
//   const transformationId = req.params.id;
//   const { title, description } = req.body;
//   let updateData = { title, description };

//   // Handle beforeImage upload
//   if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
//     const file = req.files["beforeImage"][0];
//     const imageUploadResult = await handleImageUpload(
//       req.user.payload,
//       file,
//       "beforeImage"
//     );
//     if (imageUploadResult) {
//       updateData = { ...updateData, ...imageUploadResult };
//     }
//   }

//   // Handle afterImage upload
//   if (req.files["afterImage"] && req.files["afterImage"][0]) {
//     const file = req.files["afterImage"][0];
//     const imageUploadResult = await handleImageUpload(
//       req.user.payload,
//       file,
//       "afterImage"
//     );
//     if (imageUploadResult) {
//       updateData = { ...updateData, ...imageUploadResult };
//     }
//   }

//   const updatedTransformation =
//     await ClientTransformationModel.findOneAndUpdate(
//       { _id: transformationId, trainerId: trainerId },
//       updateData,

//       // The data to update
//       { new: true, runValidators: true }
//     );

//   if (!updatedTransformation) {
//     return next(new AppError("Transformation not found", 404));
//   }
//   res.status(200).json({
//     success: true,
//     message: "Transformation updated successfully",
//     data: updatedTransformation,
//   });
// });
//////////////////////////////////////////////////////////////
const updateClientTransformation = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const transformationId = req.params.id;
  const { title, description } = req.body;
  let updateData = { title, description };

  // Ensure trainer exists
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) {
    return next(new Error("Trainer not found"));
  }

  // Handle beforeImage upload
  if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
    const file = req.files["beforeImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer, // Use trainer object instead of req.user.payload
      file,
      "beforeImage"
    );
    if (imageUploadResult) {
      // Merge the image data into updateData
      updateData.beforeImage = imageUploadResult.beforeImage;
      updateData.beforeImageHash = imageUploadResult.beforeImageHash;
    }
  }

  // Handle afterImage upload
  if (req.files["afterImage"] && req.files["afterImage"][0]) {
    const file = req.files["afterImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer, // Use trainer object instead of req.user.payload
      file,
      "afterImage"
    );
    if (imageUploadResult) {
      // Merge the image data into updateData
      updateData.afterImage = imageUploadResult.afterImage;
      updateData.afterImageHash = imageUploadResult.afterImageHash;
    }
  }

  // Update the transformation
  const updatedTransformation =
    await ClientTransformationModel.findOneAndUpdate(
      { _id: transformationId, trainerId: trainerId },
      updateData,
      { new: true, runValidators: true }
    );

  if (!updatedTransformation) {
    return next(new AppError("Transformation not found", 404));
  }

  // Respond with the updated transformation
  res.status(200).json({
    success: true,
    message: "Transformation updated successfully",
    data: updatedTransformation,
  });
});

const deleteClientTransformation = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const transformationId = req.params.id;
  const transformation = await ClientTransformationModel.findOneAndDelete({
    _id: transformationId,
    trainerId: trainerId,
  });
  if (!transformation) {
    return next(new AppError("Transformation not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Transformation deleted successfully",
  });
});

export {
  addClientTransformations,
  getClientTransformations,
  getspecificClientTransformations,
  updateClientTransformation,
  deleteClientTransformation,
};
