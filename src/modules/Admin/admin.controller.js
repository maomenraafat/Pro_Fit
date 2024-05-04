import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { adminModel } from "../../../Database/models/admin.model.js";
import { trainerModel } from "../../../Database/models/Trainer.model.js";
import { determineFolderName } from "../../multer/multer.js";
import { uploadImageToCloudinary } from "../../utils/cloudinary.js";
import { SubscriptionModel } from "../../../Database/models/subscription.model.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { traineeModel } from "../../../Database/models/Trainee.model.js";

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

const getSystemUsers = catchAsyncError(async (req, res, next) => {
  const userModel = req.query.users === "trainee" ? traineeModel : trainerModel;
  const isTrainee = req.query.users === "trainee";
  let baseQuery = userModel
    .find()
    .select(
      "firstName lastName email profilePhoto phoneNumber status createdAt"
    );
  if (isTrainee) {
    baseQuery = baseQuery
      .populate({
        path: "package",
        select: "packageName packageType -_id",
      })
      .populate({
        path: "assignedTrainer",
        select: "firstName lastName -_id",
      });
  } else {
    baseQuery = baseQuery.select("paidAmount");
  }
  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  let users = await apiFeatures.mongooseQuery;
  if (!users || users.length === 0) {
    return next(new AppError("No data found", 404));
  }

  if (!isTrainee) {
    await Promise.all(
      users.map(async (user) => {
        await user.updateSubscriptions();
        user.paidAmount = await user.calculateTotalPaidAmount();
        await user.save();
      })
    );
  }

  const data = users.map((user) => {
    const userObject = user.toObject({ virtuals: true });
    userObject.Registration_Date = userObject.createdAt
      .toISOString()
      .split("T")[0];
    delete userObject.createdAt;
    if (!isTrainee) {
      delete userObject.updatedAt;
    }
    return userObject;
  });

  let totalCount = await userModel
    .find(apiFeatures.mongooseQuery.getQuery())
    .countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    Page: apiFeatures.page,
    limit: apiFeatures.limit,
    data,
  });
});

export { updatePersonalInfo, getAdminInfo, getSystemUsers };
