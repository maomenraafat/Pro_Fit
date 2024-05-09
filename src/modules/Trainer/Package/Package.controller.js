import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import { ClientTransformationModel } from "../../../../Database/models/clientTransformations.js";
import { PackageModel } from "../../../../Database/models/Package.model.js";
import { AppError } from "../../../utils/AppError.js";
import { ApiFeatures } from "../../../utils/ApiFeatures.js";

const addPackage = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const {
    packageName,
    packageType,
    description,
    price,
    duration,
    subscribersLimit,
    active,
  } = req.body;
  const data = {
    trainerId,
    packageName,
    packageType,
    description,
    price,
    duration,
    subscribersLimit,
    active,
  };
  const newpackage = new PackageModel(data);
  await newpackage.save();
  res.status(201).json({
    success: true,
    message: "Package created successfully",
    newpackage,
  });
});
const getSpecificPackage = catchAsyncError(async (req, res, next) => {
  //const trainerId = req.user.payload.id;
  const id = req.params.id;
  const data = await PackageModel.findById(id);
  if (!data) {
    return next(new AppError("data not found", 404));
  }
  res.status(201).json({
    success: true,
    message: " success",
    data,
  });
});
const getTrainerpackages = catchAsyncError(async (req, res, next) => {
  const id = req.user.payload.id;
  let baseQuery = PackageModel.find({
    trainerId: id,
  });
  let apiFeatures = new ApiFeatures(baseQuery, req.query)
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();
  let data = await apiFeatures.mongooseQuery;
  if (!data || data.length === 0) {
    res.status(200).json({
      success: true,
      totalDocuments: 0,
      totalPages: 0,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      message: "No data found",
      data: [],
    });
    return;
  }
  let totalCount = await PackageModel.find(
    apiFeatures.mongooseQuery.getQuery()
  ).countDocuments();
  const totalPages = Math.ceil(totalCount / apiFeatures.limit);

  res.status(200).json({
    success: true,
    totalDocuments: totalCount,
    totalPages: totalPages,
    page: apiFeatures.page,
    limit: apiFeatures.limit,
    message: "Packages information retrieved successfully",
    data,
  });
});

const updatePackage = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  // const {
  //   packageName,
  //   packageType,
  //   description,
  //   price,
  //   duration,
  //   subscribersLimit,
  // } = req.body;
  const newpackage = await PackageModel.findOneAndUpdate(
    {
      _id: id,
      trainerId: trainerId,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(201).json({
    success: true,
    message: "Package updated successfully",
    newpackage,
  });
});
const deletePackage = catchAsyncError(async (req, res, next) => {
  const trainerId = req.user.payload.id;
  const id = req.params.id;
  const delPackage = await PackageModel.findOneAndDelete({
    _id: id,
    trainerId: trainerId,
  });
  if (!delPackage) {
    return next(new AppError("package not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Package deleted successfully",
  });
});

export {
  addPackage,
  getSpecificPackage,
  getTrainerpackages,
  updatePackage,
  deletePackage,
};
