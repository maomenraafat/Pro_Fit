import { generateToken } from "../../../middlewares/authToken.js";
import { AppError } from "../../../utils/AppError.js";
import { catchAsyncError } from "../../../utils/catchAsyncError.js";
import { trainerModel } from "../../../../Database/models/Trainer.model.js";
import bcrypt from "bcrypt";
import { adminModel } from "../../../../Database/models/admin.model.js";

const signUp = catchAsyncError(async (req, res, next) => {
  const { firstName, lastName, email, password, nationalId } = req.body;

  // Check if the user already exists
  // const checkemail = await trainerModel.findOne({ email });
  // if (checkemail) {
  //   return next(new AppError("user already exists.", 409));
  // }
  const checkTrainerEmail = await trainerModel.findOne({ email });
  const checkAdminEmail = await adminModel.findOne({ email });
  if (checkTrainerEmail || checkAdminEmail) {
    return next(new AppError("user already exists.", 409));
  }
  const checknationalId = await trainerModel.findOne({ nationalId });
  if (checknationalId) {
    return next(new AppError("user already exists.", 409));
  }

  const newTrainer = new trainerModel({
    firstName,
    lastName,
    email,
    password,
    nationalId,
  });

  const hashedPassword = bcrypt.hashSync(password, 10);
  newTrainer.password = hashedPassword;

  // Save the trainer to the database
  await newTrainer.save();
  const token = generateToken(newTrainer);
  res.status(201).json({
    success: true,
    message: "Account created successfully ",
    token,
  });
});
const SignIn = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  let user =
    (await trainerModel.findOne({ email })) ||
    (await adminModel.findOne({ email }));
  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Incorrect email or password", 401));
  }
  const token = generateToken(user);
  if (user.role === "admin") {
    return res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      user: {
        role: user.role,
      },
      token,
    });
  } else {
    if (user.status === "incomplete") {
      return res.status(200).json({
        success: true,
        message: "Please complete your profile.",
        user: {
          role: user.role,
          status: user.status,
        },
      });
    } else if (user.status !== "accepted") {
      return res.status(200).json({
        success: true,
        message: "Your account is currently under review.",
        user: {
          role: user.role,
          status: user.status,
        },
      });
    } else if (user.status === "accepted") {
      return res.status(200).json({
        success: true,
        message: "Logged in successfully!",
        user: {
          role: user.role,
          status: user.status,
        },
        token,
      });
    }
  }
});

export { signUp, SignIn };
