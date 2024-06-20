import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";
import { readFileSync, unlinkSync } from "fs";
import { createHash } from "crypto";
import streamifier from "streamifier";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateImageHash = (input) => {
  let fileBuffer;
  if (Buffer.isBuffer(input)) {
    fileBuffer = input;
  } else if (typeof input === "string") {
    fileBuffer = readFileSync(input);
  } else {
    throw new TypeError(
      "The input must be a Buffer or a string representing the file path."
    );
  }
  const hashSum = createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
};

const uploadImageToCloudinary = async (
  input,
  folderName,
  existingImageHash
) => {
  const newImageHash = generateImageHash(input);

  if (newImageHash === existingImageHash) {
    if (!Buffer.isBuffer(input)) {
      unlinkSync(input);
    }
    return null;
  }

  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folderName, resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Upload failed:", error);
            return reject(
              new Error(
                "Failed to upload image to Cloudinary: " + error.message
              )
            );
          }
          resolve({ url: result.secure_url, hash: newImageHash });
        }
      );

      if (Buffer.isBuffer(input)) {
        streamifier.createReadStream(input).pipe(uploadStream);
      } else {
        streamifier.createReadStream(readFileSync(input)).pipe(uploadStream);
      }
    });
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Failed to upload image to Cloudinary: " + error.message);
  }
};

export { cloudinary, generateImageHash, uploadImageToCloudinary };
