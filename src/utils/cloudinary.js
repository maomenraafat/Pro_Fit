import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";
import { readFileSync, unlinkSync } from "fs";
import { createHash } from "crypto";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateImageHash = (filePath) => {
  const fileBuffer = readFileSync(filePath);
  const hashSum = createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
};

// const uploadImageToCloudinary = async (file, folderName, existingImageHash) => {
//   const newImageHash = generateImageHash(file.path);

//   if (newImageHash === existingImageHash) {
//     console.log("Image is the same as the existing one. Skipping upload.");
//     unlinkSync(file.path);
//     return null;
//   }

//   try {
//     const fileName = file.filename;
//     const result = await cloudinary.uploader.upload(file.path, {
//       folder: folderName,
//       public_id: fileName.replace(/\.jpeg|\.jpg|\.png|\.gif/, ""),
//       resource_type: "auto",
//     });

//     if (result) {
//       unlinkSync(file.path);
//       return { url: result.secure_url, hash: newImageHash };
//     }
//     return null;
//   } catch (error) {
//     console.error("Upload failed:", error);
//     throw new Error("Failed to upload image to Cloudinary: " + error.message);
//   }
// };

const uploadImageToCloudinary = async (file, folderName, existingImageHash) => {
  let buffer, newImageHash;

  if (Buffer.isBuffer(file)) {
    buffer = file;
    newImageHash = generateImageHash(buffer);
  } else {
    buffer = readFileSync(file.path);
    newImageHash = generateImageHash(buffer);
  }

  if (newImageHash === existingImageHash) {
    console.log("Image is the same as the existing one. Skipping upload.");
    if (!Buffer.isBuffer(file)) unlinkSync(file.path);
    return null;
  }

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName, resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Upload failed:", error);
          throw new Error("Failed to upload image to Cloudinary: " + error.message);
        }
        if (result) {
          if (!Buffer.isBuffer(file)) unlinkSync(file.path);
          return { url: result.secure_url, hash: newImageHash };
        }
        return null;
      }
    );

    if (Buffer.isBuffer(file)) {
      uploadStream.end(buffer);
    } else {
      const fileStream = readFileSync(file.path);
      uploadStream.end(fileStream);
    }
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Failed to upload image to Cloudinary: " + error.message);
  }
};

export { cloudinary, generateImageHash, uploadImageToCloudinary };
