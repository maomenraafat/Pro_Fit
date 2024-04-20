import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { adminModel } from "../../../Database/models/admin.model.js";
import { trainerModel } from "../../../Database/models/Trainer.model.js";
import { determineFolderName } from "../../multer/multer.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";

async function handleImageUpload(admin, file) {
  const simulatedReq = {
    user: {
      payload: admin,
    },
  };
  const folderName = determineFolderName(simulatedReq, "profilePhoto");
  const existingImageHash = admin.profilePhotoHash;

  const uploadResult = await uploadImageToCloudinary(
    file,
    folderName,
    existingImageHash
  );
  if (uploadResult) {
    return {
      profilePhoto: uploadResult.url,
      profilePhotoHash: uploadResult.hash,
    };
  }

  return null;
}

const updatePersonalInfo = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const { firstName, lastName, email, password } = req.body;
  let updateData = {
    firstName,
    lastName,
    email,
    password,
  };
  const admin = await adminModel.findById(id);
  if (!admin) {
    return next(new Error("admin not found"));
  }
  if (req.files["profilePhoto"] && req.files["profilePhoto"][0]) {
    const file = req.files["profilePhoto"][0];
    const imageUploadResult = await handleImageUpload(admin, file);
    if (imageUploadResult) {
      updateData = { ...updateData, ...imageUploadResult };
    }
  }
  const data = await adminModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!data) {
    return next(new Error("Data not found"));
  }
  res.status(201).json({
    success: true,
    message: "Data updated successfully",
    data,
  });
});
const getAdminInfo = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  const data = await adminModel
    .findById(id)
    .select("firstName lastName email password profilePhoto role");
  if (!data) {
    return next(new AppError("No data found ", 404));
  }
  res.status(200).json({
    success: true,
    data,
  });
});

export { updatePersonalInfo, getAdminInfo };
