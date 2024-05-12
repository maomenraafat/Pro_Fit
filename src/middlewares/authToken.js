import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { traineeModel } from "../../Database/models/Trainee.model.js";
import { SubscriptionModel } from "../../Database/models/subscription.model.js";
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated", Auth: false });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid token", Auth: false });
    }

    if (!decoded || !decoded.payload.role) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token", Auth: false });
    }

    req.user = decoded;

    next();
  });
};

// const generateToken = (id, email, role) => {
//   const options = { expiresIn: "10d" };
//   return jwt.sign({ id, email, role }, SECRET_KEY, options);
// };
const generateToken = (user) => {
  const options = { expiresIn: "10d" };
  const payload = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    isConfirmed: user.isConfirmed,
  };
  return jwt.sign({ payload }, SECRET_KEY, options);
};

const allowedTo = (...permittedRoles) => {
  return (req, res, next) => {
    if (!req.user || !permittedRoles.includes(req.user.payload.role)) {
      return res.status(401).json({
        success: false,
        message: `You do not have permission to access this resource ${req.user.payload.role}`,
        Auth: false,
      });
    }
    next();
  };
};

// const restrictAccess = (statusField) => {
//   return async (req, res, next) => {
//     console.log(req.user.payload.id);
//     const trainee = await traineeModel.findById({ _id: req.user.payload.id });

//     if (!trainee) {
//       return res.status(404).json({ message: "Trainee not found" });
//     }

//     const allowedStatuses = ["In Preparation", "Working", "Pending"];

//     if (!allowedStatuses.includes(trainee[statusField])) {
//       return res.status(403).json({
//         message: "Access denied. Your status does not permit access.",
//       });
//     }
//     next();
//   };
// };

const restrictAccess = (
  statusField,
  allowedStatuses,
  idParamName = "id",
  useTokenAsPrimary = false
) => {
  return async (req, res, next) => {
    // Choose primary source based on the mode
    const userId = useTokenAsPrimary
      ? req.user?.payload?.id || req.params[idParamName]
      : req.params[idParamName] || req.user?.payload?.id;

    console.log(
      `Checking access for user ID: ${userId} with status field: ${statusField}`
    );

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required for access control.",
      });
    }

    try {
      const trainee = await traineeModel.findOne({
        _id: userId,
        [statusField]: { $in: allowedStatuses },
      });

      if (!trainee) {
        console.log(`Access denied or trainee not found for ID: ${userId}`);
        return res.status(404).json({
          message: "Trainee not found or status does not permit access",
        });
      }

      console.log(`Access granted for user ID: ${userId}`);
      next();
    } catch (error) {
      console.error(`Error accessing data for user ID: ${userId}: ${error}`);
      return res.status(500).json({
        message: "Server error while checking access permissions",
      });
    }
  };
};

const checkIfAlreadySubscribed = async (req, res, next) => {
  try {
    const traineeId = req.user.payload.id;
    const trainerId = req.params.id;

    const activeSubscription = await SubscriptionModel.findOne({
      traineeId: traineeId,
      trainerId: trainerId,
      status: "Active",
      endDate: { $gte: new Date() },
    });

    if (activeSubscription) {
      return res.status(403).json({
        message:
          "You already have an active subscription with this trainer. Cannot subscribe to a new package.",
      });
    }

    next();
  } catch (error) {
    next(new AppError("Error checking subscription status.", 500));
  }
};

export {
  verifyToken,
  generateToken,
  allowedTo,
  restrictAccess,
  checkIfAlreadySubscribed,
};
