import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../utils/AppError.js";
import { fileURLToPath } from "url";

function multerRefactor() {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let name = "default11";
      if (req.body.firstName && req.body.lastName) {
        name = `${req.body.firstName} ${req.body.lastName}`;
      } else if (
        req.user &&
        req.user.payload &&
        req.user.payload.firstName &&
        req.user.payload.lastName
      ) {
        name = `${req.user.payload.firstName} ${req.user.payload.lastName}`;
      }
      let subfolderName;
      switch (file.fieldname) {
        case "profilePhoto":
          subfolderName = "ProfilePhotos";
          break;
        case "nationalId":
          subfolderName = "NationalIDs";
          break;
        case "photo":
          subfolderName = "qualificationsAndAchievements";
          break;
        case "beforeImage":
        case "afterImage":
          subfolderName = "ClientTransformations";
          break;
        case "ExerciseImage":
          subfolderName = "ExerciseImages";
          break;
        case "foodImage":
          subfolderName = "FoodImages";
          break;
        default:
          subfolderName = "Other";
      }

      let role = "default";
      if (req.body.role) {
        role = req.body.role;
      } else if (req.user && req.user.payload && req.user.payload.role) {
        role = req.user.payload.role;
      }

      const validRoles = ["trainer", "trainee", "admin"];
      if (!validRoles.includes(role)) {
        role = "default";
      }

      const rolePath = `${role.charAt(0).toUpperCase() + role.slice(1)}s`;
      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      const dir = path.join(
        __dirname,
        `../uploads/${rolePath}/${name}/${subfolderName}`
      );

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, `${file.fieldname}-${Date.now()}-${uniqueSuffix}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files or PDF are allowed!", 401), false);
    }
  };

  return multer({ storage, fileFilter });
}

export const uploadMixOfFiles = (arrOfFields) => {
  return multerRefactor().fields(arrOfFields);
};
export const uploadqualification = () => {
  return multerRefactor().single("photo");
};

export const uploadTraineeImage = () => {
  return multerRefactor().single("profilePhoto");
};
export const uploadChallengeImage = () => {
  return multerRefactor().single("challengeImage");
};
export const uploadProgressImage = () => {
  return multerRefactor().single("progressImage");
};

export const uploadExerciseImage = () => {
  return multerRefactor().single("ExerciseImage");
};

export const uploadFoodImage = () => {
  return multerRefactor().single("foodImage");
};

export function determineFolderName(req, fieldName) {
  let name = "default11";

  if (req.user && req.user.payload) {
    const { firstName, lastName } = req.user.payload;
    // Construct the folder name using the trainer's first and last name
    name = `${firstName || ""} ${lastName || ""}`.trim() || name;
  }

  let subfolderName = "Other";
  switch (fieldName) {
    case "profilePhoto":
      subfolderName = "ProfilePhotos";
      break;
    case "nationalId":
      subfolderName = "NationalIDs";
      break;
    case "photo":
      subfolderName = "qualificationsAndAchievements";
      break;
    case "beforeImage":
    case "afterImage":
      subfolderName = "ClientTransformations";
      break;
    case "ExerciseImage":
      subfolderName = "ExerciseImages";
      break;
    case "foodImage":
      subfolderName = "FoodImages";
      break;
    default:
      subfolderName = "Other";
  }

  let role = "default";
  if (req.user && req.user.payload && req.user.payload.role) {
    role = req.user.payload.role;
  }
  const validRoles = ["trainer", "trainee", "admin"];
  role = validRoles.includes(role) ? role : "default";
  // if (role === "trainer") {
  //   role = "Trainers"; // Adjust this if you want a specific naming convention for the role folder
  // } else {
  //   role = "Others"; // Default role folder
  // }

  const rolePath = role.charAt(0).toUpperCase() + role.slice(1);
  const folderPath = `${rolePath}/${name}/${subfolderName}`;

  return folderPath;
}
