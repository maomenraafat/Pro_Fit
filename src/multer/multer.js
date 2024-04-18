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

export const uploadExerciseImage = () => {
  return multerRefactor().single("ExerciseImage");
};

export const uploadFoodImage = () => {
  return multerRefactor().single("foodImage");
};

// export function determineFolderName(req, fieldName) {
//   let name = "default11";
//   // if (req.body.firstName && req.body.lastName) {
//   //   name = `${req.body.firstName} ${req.body.lastName}`;
//   // } else
//   if (
//     req.user &&
//     req.user.payload &&
//     req.user.payload.firstName &&
//     req.user.payload.lastName
//   ) {
//     name = `${req.user.payload.firstName} ${req.user.payload.lastName}`;
//   }

//   let subfolderName;
//   switch (fieldName) {
//     case "profilePhoto":
//       subfolderName = "ProfilePhotos";
//       break;
//     case "nationalId":
//       subfolderName = "NationalIDs";
//       break;
//     case "photo":
//       subfolderName = "qualificationsAndAchievements";
//       break;
//     case "beforeImage":
//     case "afterImage":
//       subfolderName = "ClientTransformations";
//       break;
//     case "ExerciseImage":
//       subfolderName = "ExerciseImages";
//       break;
//     case "foodImage":
//       subfolderName = "FoodImages";
//       break;
//     default:
//       subfolderName = "Other";
//   }

//   let role = "default";
//   // if (req.body.role) {
//   //   role = req.body.role;
//   // } else
//   if (req.user && req.user.payload && req.user.payload.role) {
//     role = req.user.payload.role;
//   }

//   const validRoles = ["trainer", "trainee", "admin"];
//   if (!validRoles.includes(role)) {
//     role = "default";
//   }

//   const rolePath = `${role.charAt(0).toUpperCase() + role.slice(1)}s`;

//   // Construct the folder path
//   const folderPath = `${rolePath}/${name}/${subfolderName}`;
//   return folderPath;
// }

// export function determineFolderName(req, fieldName) {
//   let name = "default11";
//   if (req.user && req.user.payload) {
//     const payload = req.user.payload;
//     if (payload.firstName && payload.lastName) {
//       name = `${payload.firstName} ${payload.lastName}`;
//     } else if (payload.name) {
//       // Assuming there might be a single name field
//       name = payload.name;
//     }
//   }

//   let subfolderName;
//   // Your switch statement for subfolderName remains unchanged...

//   let role = "default";
//   if (req.user && req.user.payload && req.user.payload.role) {
//     role = req.user.payload.role;
//   }

//   const validRoles = ["trainer", "trainee", "admin"];
//   if (!validRoles.includes(role)) {
//     role = "default";
//   }

//   const rolePath = `${role.charAt(0).toUpperCase() + role.slice(1)}s`;
//   const folderPath = `${rolePath}/${name}/${subfolderName}`;
//   return folderPath;
// }

// export function determineFolderName(req, fieldName) {
//   //var imageType = { "beforeImage", "afterImage" };

//   let name = "default11";

//   // If user information is available, construct the name from first and last name
//   if (req.user && req.user.payload) {
//     const { firstName, lastName } = req.user.payload;
//     name = `${firstName || ""} ${lastName || ""}`.trim() || name;
//   }

//   let subfolderName = "Other"; // Default subfolder name
//   // Switch case to determine subfolder based on fieldName
//   switch (fieldName) {
//     case "profilePhoto":
//       subfolderName = "ProfilePhotos";
//       break;
//     case "nationalId":
//       subfolderName = "NationalIDs";
//       break;
//     case "photo":
//       subfolderName = "qualificationsAndAchievements";
//       break;
//     case "beforeImage":
//     case "afterImage":
//       subfolderName = "ClientTransformations";
//       break;
//     case "ExerciseImage":
//       subfolderName = "ExerciseImages";
//       break;
//     case "foodImage":
//       subfolderName = "FoodImages";
//       break;
//     default:
//       subfolderName = "Other";
//   }

//   // Default role is "default"
//   let role = "default";

//   // If user information is available, get the role from user payload
//   if (req.user && req.user.payload && req.user.payload.role) {
//     role = req.user.payload.role;
//   }

//   // Debugging: Log role before validation
//   console.log(`Role before validation: ${role}`);

//   // Valid roles to be used
//   const validRoles = ["trainer", "trainee", "admin"];

//   // If role is not in validRoles, default to "default"
//   if (!validRoles.includes(role)) {
//     // Debugging: Log role if it's not in validRoles
//     console.log(`Role not in valid roles, defaulting: ${role}`);
//     role = "default";
//   }

//   // Construct the role path by capitalizing the role and appending "s"
//   const rolePath = `${role.charAt(0).toUpperCase() + role.slice(1)}s`;

//   // Construct the full folder path
//   const folderPath = `${rolePath}/${name}/${subfolderName}`;

//   // Return the folder path
//   return folderPath;
// }
// export function determineFolderName(req, fieldName) {
//   let name = "default11";

//   if (req.user && req.user.payload) {
//     const { firstName, lastName } = req.user.payload;
//     name = `${firstName || ""} ${lastName || ""}`.trim() || name;
//   }

//   let subfolderName = "Other";
//   switch (fieldName) {
//     case "profilePhoto":
//       subfolderName = "ProfilePhotos";
//       break;
//     case "nationalId":
//       subfolderName = "NationalIDs";
//       break;
//     case "photo":
//       subfolderName = "qualificationsAndAchievements";
//       break;
//     case "beforeImage":
//     case "afterImage":
//       subfolderName = "ClientTransformations";
//       break;
//     // Add other cases as necessary
//   }

//   let role = "default";
//   if (req.user && req.user.payload && req.user.payload.role) {
//     role = req.user.payload.role;
//   }

//   // Validate and adjust the role as needed
//   const validRoles = ["trainer", "trainee", "admin"];
//   role = validRoles.includes(role) ? role : "default";

//   const rolePath = `${role.charAt(0).toUpperCase() + role.slice(1)}s`;
//   const folderPath = `${rolePath}/${name}/${subfolderName}`;

//   return folderPath;
// }
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
  // Ensure the role is valid and set to "Trainer" if needed
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
