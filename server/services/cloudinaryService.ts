import cloudinary from "../config/cloudinary";
import { Readable } from "stream";


export const uploadFileToCloudinary = async (
  fileBuffer: Buffer,
  filename?: string
): Promise<{ url: string; public_id: string } | { success: false; message: string }> => {
  try {
    const result = await new Promise<{ url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "chat_app", resource_type: "auto", public_id: filename },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result from Cloudinary"));
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );

      const stream = Readable.from(fileBuffer);
      stream.pipe(uploadStream);
    });

    return result;
  } catch (error: any) {
    return { success: false, message: error.message || "Upload failed" };
  }
};
