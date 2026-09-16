// Sets up and exports a single, shared Cloudinary client.
// Cloudinary is a third-party service that stores and serves images for
// us (so we don't have to manage image file storage on our own server).
// Any file that needs to upload/delete an image imports this configured
// client instead of setting up its own connection.
const cloudinary = require("cloudinary").v2;

// Credentials come from environment variables (set in backend/.env), never
// hardcoded here - that keeps secrets out of source control.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
