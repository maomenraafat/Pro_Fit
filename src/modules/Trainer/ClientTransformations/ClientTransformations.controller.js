import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { AppError } from "../../../utils/AppError.js";
import { determineFolderName } from "../../../multer/multer.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";

async function handleImageUpload(trainer, file, imageType) {
  const validImageTypes = ["beforeImage", "afterImage"];
  if (!validImageTypes.includes(imageType)) {
    console.error("Invalid image type");
    return null;
  }

  const folderName = determineFolderName(
    { user: { payload: trainer } },
    imageType
  );
  const existingImageHash = trainer[imageType + "Hash"];

  const uploadResult = await uploadImageToCloudinary(
    file,
    folderName,
    existingImageHash
  );
  if (uploadResult) {
    return {
      [imageType]: uploadResult.url,
      [imageType + "Hash"]: uploadResult.hash,
    };
  }

  return null;
}

const addClientTransformations = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const { title, description } = req.body;
  let data = { trainerId, title, description };
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) {
    return next(new Error("Trainer not found"));
  }
  if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
    const file = req.files["beforeImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer,
      file,
      "beforeImage"
    );
    if (imageUploadResult) {
      data.beforeImage = imageUploadResult.beforeImage;
      data.beforeImageHash = imageUploadResult.beforeImageHash;
    }
  }
  if (req.files["afterImage"] && req.files["afterImage"][0]) {
    const file = req.files["afterImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer,
      file,
      "afterImage"
    );
    if (imageUploadResult) {
      data.afterImage = imageUploadResult.afterImage;
      data.afterImageHash = imageUploadResult.afterImageHash;
    }
  }
  const transformation = new ClientTransformationModel(data);
  await transformation.save();
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

const updateClientTransformation = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const transformationId = req.params.id;
  const { title, description } = req.body;
  let updateData = { title, description };
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) {
    return next(new Error("Trainer not found"));
  }
  if (req.files["beforeImage"] && req.files["beforeImage"][0]) {
    const file = req.files["beforeImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer,
      file,
      "beforeImage"
    );
    if (imageUploadResult) {
      updateData.beforeImage = imageUploadResult.beforeImage;
      updateData.beforeImageHash = imageUploadResult.beforeImageHash;
    }
  }

  if (req.files["afterImage"] && req.files["afterImage"][0]) {
    const file = req.files["afterImage"][0];
    const imageUploadResult = await handleImageUpload(
      trainer,
      file,
      "afterImage"
    );
    if (imageUploadResult) {
      updateData.afterImage = imageUploadResult.afterImage;
      updateData.afterImageHash = imageUploadResult.afterImageHash;
    }
  }
  const updatedTransformation =
    await ClientTransformationModel.findOneAndUpdate(
      { _id: transformationId, trainerId: trainerId },
      updateData,
      { new: true, runValidators: true }
    );

  if (!updatedTransformation) {
    return next(new AppError("Transformation not found", 404));
  }

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
