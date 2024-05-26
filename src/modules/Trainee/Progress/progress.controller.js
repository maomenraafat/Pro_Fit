import { progressModel } from "../../../../Database/models/Progress.model.js";
import { traineeDietAssessmentModel } from "../../../../Database/models/traineeDietAssessment.model.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";
import moment from 'moment';

const addProgressPhoto = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  let imageUrl = null;

  // Check if the file is uploaded
  if (req.file) {
    const folderName = `Progress/${traineeId}`;
    const uploadResult = await uploadImageToCloudinary(req.file, folderName);
    if (uploadResult && uploadResult.url) {
      imageUrl = uploadResult.url;
    }
  }

  // Create the new progress entry
  const newProgress = await progressModel.create({
    trainee: traineeId,
    image: imageUrl,
  });

  res.status(201).json({
    success: true,
    message: "Progress added successfully.",
    data: { _id: newProgress._id },
  });
});

const getProgressPhoto = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  // Retrieve all progress entries for the trainee
  const progressEntries = await progressModel.find({ trainee: traineeId });

  // Format the response to contain progressId, photo URL, and formatted createdAt date
  const formattedProgressEntries = progressEntries.map(entry => ({
    progressId: entry._id,
    photo: entry.image,
    createdAt: moment(entry.createdAt).format('D MMM, YYYY')
  }));

  res.status(200).json({
    success: true,
    message: "Progress entries retrieved successfully.",
    data: formattedProgressEntries,
  });
});

const deleteProgressPhoto = catchAsyncError(async (req, res) => {
  const { progressId } = req.params;
  const traineeId = req.user.payload.id;

  const progressEntry = await progressModel.findById(progressId);

  if (!progressEntry) {
    return res.status(404).json({
      success: false,
      message: "Progress entry not found.",
    });
  }

  if (progressEntry.trainee.toString() !== traineeId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this progress entry.",
    });
  }

  await progressModel.findByIdAndDelete(progressId);

  res.status(200).json({
    success: true,
    message: "Progress entry deleted successfully.",
  });
});

const getDietAssessmentMeasurements = catchAsyncError(async (req, res) => {
  const traineeId = req.user.payload.id;

  // Retrieve all diet assessments for the trainee
  const assessments = await traineeDietAssessmentModel.find({ trainee: traineeId }).sort({ createdAt: -1 });

  // Format the assessments
  const formattedAssessments = assessments.map(assessment => ({
    weight: {
      value: assessment.weight,
      date: moment(assessment.createdAt).format('D MMMM, YYYY')
    },
    bodyFat: {
      value: assessment.bodyFat,
      date: moment(assessment.createdAt).format('D MMMM, YYYY')
    },
    waistArea: {
      value: assessment.waistArea,
      date: moment(assessment.createdAt).format('D MMMM, YYYY')
    },
    neckArea: {
      value: assessment.neckArea,
      date: moment(assessment.createdAt).format('D MMMM, YYYY')
    }
  }));

  // Group assessments by measurement type
  const groupedAssessments = {
    weight: formattedAssessments.map(a => a.weight),
    bodyFat: formattedAssessments.map(a => a.bodyFat),
    waistArea: formattedAssessments.map(a => a.waistArea),
    neckArea: formattedAssessments.map(a => a.neckArea)
  };

  res.status(200).json({
    success: true,
    message: "Diet assessment measurements retrieved successfully.",
    data: groupedAssessments
  });
});


export { addProgressPhoto, getProgressPhoto ,deleteProgressPhoto,getDietAssessmentMeasurements};
