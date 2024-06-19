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
    res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No data found",
      data: [],
      allData: [],
    });
    return;
  }

  if (!isTrainee) {
    await Promise.all(
      users.map(async (user) => {
        user.activeSubscribers = await user.fetchActiveSubscribers();
        user.paidAmount = await user.calculateTotalPaidAmount();
        await user.save();
      })
    );
  }
  const data = users.map((user) => {
    const userObject = user.toObject({ virtuals: true });
    userObject.Registration_Date = userObject.createdAt;
    delete userObject.createdAt;
    if (!isTrainee) {
      delete userObject.updatedAt;
    }
    return userObject;
  });

  const allUsers = await userModel
    .find()
    .select(
      "firstName lastName email profilePhoto phoneNumber status createdAt"
    );
  const allData = allUsers.map((user) => user.toObject({ virtuals: true }));

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
    allData,
  });
});

const getAllSubscriptions = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  let trainerIds = [],
    traineeIds = [];
  if (req.query.keywords) {
    const nameParts = req.query.keywords.split(" ");
    let regex = new RegExp(`^${req.query.keywords}$`, "i");

    let searchQuery = {
      $or: [{ firstName: regex }, { lastName: regex }],
    };

    if (nameParts.length > 1) {
      regex = nameParts.map((name) => new RegExp(`^${name}$`, "i"));

      searchQuery = {
        $or: [
          { firstName: regex[0], lastName: regex[1] },
          { firstName: regex[1], lastName: regex[0] },
        ],
      };
    }

    const trainers = await trainerModel.find(searchQuery).select("_id");
    trainerIds = trainers.map((trainer) => trainer._id);

    const trainees = await traineeModel.find(searchQuery).select("_id");
    traineeIds = trainees.map((trainee) => trainee._id);
  }

  let query = {
    $or: [
      { trainerId: { $in: trainerIds } },
      { traineeId: { $in: traineeIds } },
    ],
  };

  if (!trainerIds.length && !traineeIds.length) {
    query = {};
  }

  let baseQuery = SubscriptionModel.find(query)
    .select("startDate paidAmount status subscriptionType duration")
    .populate({
      path: "trainerId",
      select: "firstName lastName",
      justOne: true,
      match: { _id: { $exists: true } },
    })
    .populate({
      path: "traineeId",
      select: "firstName lastName",
      justOne: true,
      match: { _id: { $exists: true } },
    })
    .populate({
      path: "package",
      select: "packageName -_id",
      justOne: true,
      match: { _id: { $exists: true } },
    });

  let clonedQuery = SubscriptionModel.find(query)
    .select("startDate paidAmount status subscriptionType duration")
    .populate({
      path: "trainerId",
      select: "firstName lastName",
      justOne: true,
      match: { _id: { $exists: true } },
    })
    .populate({
      path: "traineeId",
      select: "firstName lastName",
      justOne: true,
      match: { _id: { $exists: true } },
    })
    .populate({
      path: "package",
      select: "packageName -_id",
      justOne: true,
      match: { _id: { $exists: true } },
    });

  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .filter()
    .sort()
    .paginate()
    .fields();

  let subscriptions = await apiFeatures.mongooseQuery;
  let allSubscriptions = await clonedQuery;

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No subscriptions found",
      data: [],
      allData: [],
    });
  }

  const mapSubscription = (subscription) => ({
    id: subscription._id,
    trainerName: subscription.trainerId
      ? `${subscription.trainerId.firstName} ${subscription.trainerId.lastName}`
      : "No Trainer",
    traineeName: subscription.traineeId
      ? `${subscription.traineeId.firstName} ${subscription.traineeId.lastName}`
      : "No Trainee",
    startDate: subscription.startDate,
    packageName: subscription.package?.packageName || "No Package",
    Amount: subscription.paidAmount,
    duration: subscription.duration,
    subscriptionType: subscription.subscriptionType,
    status: subscription.status,
  });

  const data = subscriptions.map(mapSubscription);
  const allData = allSubscriptions.map(mapSubscription);

  let totalCount = await SubscriptionModel.countDocuments(query);
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Subscriptions information retrieved successfully",
    data,
    allData,
  });
});

export {
  updatePersonalInfo,
  getAdminInfo,
  getSystemUsers,
  getAllSubscriptions,
};
