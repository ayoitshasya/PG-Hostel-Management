const { processAndUploadImage, deletePhotoAssets } = require("../lib/imagePipeline");

exports.uploadPhotos = async (req, res) => {
  if (req.user.role !== "renter")
    return res.status(403).json({ error: "Only renters can upload listing photos" });

  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: "No files uploaded" });

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
