// Controller for the listing-photo upload endpoint. The actual image
// processing (resizing, format conversion, uploading to Cloudinary) lives in
// lib/imagePipeline.js - this file's job is just to loop over the uploaded
// files, call that pipeline for each one, and handle partial failures
// cleanly.

const { processAndUploadImage, deletePhotoAssets } = require("../lib/imagePipeline");

// POST /api/uploads/photos - upload up to MAX_FILES listing photos.
// Requires login AND the "renter" role. The actual files arrive via
// multer (see middleware/upload.js), which populates req.files.
exports.uploadPhotos = async (req, res) => {
  if (req.user.role !== "renter")
    return res.status(403).json({ error: "Only renters can upload listing photos" });

  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: "No files uploaded" });

  // Promise.allSettled (unlike Promise.all) waits for EVERY upload to
  // finish, whether it succeeds or fails, instead of stopping at the first
  // rejection - that's what lets us tell the difference between "all
  // failed", "all succeeded", and "some failed" below.
  const results = await Promise.allSettled(
    files.map((file) => processAndUploadImage(file.buffer, { folder: "roomie/properties" }))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const failed = results.filter((r) => r.status === "rejected");

  if (failed.length > 0) {
    // Roll back every file that DID succeed in this batch, so a partially
    // failed upload doesn't leave orphaned Cloudinary files behind - the
    // caller gets an all-or-nothing result, matching what they'd expect
    // from "upload these N photos" failing.
    if (succeeded.length > 0) {
      await deletePhotoAssets(succeeded);
    }
    const firstError = failed[0].reason?.message || "Unknown error";
    console.error(`Photo upload batch failed (${failed.length}/${files.length} file(s) failed): ${firstError}`);
    return res.status(400).json({ error: `Could not process one of the uploaded images: ${firstError}` });
  }

  res.status(201).json({ photoAssets: succeeded });
};
