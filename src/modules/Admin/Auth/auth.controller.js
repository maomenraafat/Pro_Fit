import { generateToken } from "../../../middlewares/authToken.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { AppError } from "../../../utils/AppError.js";
import bcrypt from "bcrypt";
import { adminModel } from "../../../../Database/models/admin.model.js";
import { determineFolderName } from "../../../multer/multer.js";
import { uploadImageToCloudinary } from "../../../utils/cloudinary.js";

async function handleImageUpload(file) {
  // const simulatedReq = {
  //   user: {
  //     payload: admin,
  //   },
  // };
  const folderName = determineFolderName(/*simulatedReq,*/ "profilePhoto");
  // const existingImageHash = admin.profilePhotoHash;

  const uploadResult = await uploadImageToCloudinary(
    file,
    folderName
    // existingImageHash
  );
  if (uploadResult) {
    return {
      profilePhoto: uploadResult.url,
      // profilePhotoHash: uploadResult.hash,
    };
  }

  return null;
}

const SignUp = catchAsyncError(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  const existingUser = await adminModel.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already exists.", 409));
  }

  let data = new adminModel({
    firstName,
    lastName,
    email,
    password,
  });
  // if (req.files["profilePhoto"] && req.files["profilePhoto"][0]) {
  //   const file = req.files["profilePhoto"][0];
  //   const imageUploadResult = await handleImageUpload(file);
  //   if (imageUploadResult) {
  //     Object.assign(data, imageUploadResult);
  //   }
  // }
  await data.save();
  res.status(201).json({ success: true, data });
});

const signIn = catchAsyncError(async (req, res, next) => {
  let { email, password } = req.body;
  const admin = await adminModel.findOne({ email });
  if (!admin) {
    return next(new AppError("Admin not found or You're not Admin!", 404));
  }
  const match = bcrypt.compareSync(password, admin.password);
  if (!match) {
    return next(new AppError("Invalid password", 401));
  }
  if (admin) {
    const token = generateToken(admin);
    await admin.save();
    res.status(200).json({ message: "success", token });
  }
});
const logoutAdmin = catchAsyncError(async (req, res, next) => {
  const adminId = req.user.payload.id;
  const admin = await adminModel.findById(adminId);
  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }
  admin.isOnline = false;
  await admin.save();
  res.status(200).json({ message: "Admin successfully logged out" });
});

export { SignUp, signIn, logoutAdmin, handleImageUpload };
