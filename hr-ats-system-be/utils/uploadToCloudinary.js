const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const fileName = originalName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    const publicId = `${Date.now()}-${fileName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hr-ats/resumes",

        // PDF ko RAW resource ke taur par upload karo
        resource_type: "raw",

        public_id: publicId,

        format: "pdf",
      },

      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier
      .createReadStream(buffer)
      .pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;