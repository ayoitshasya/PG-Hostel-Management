const { processAndUploadImage } = require("../lib/imagePipeline");

exports.uploadPhotos = async (req, res) => {
  if (req.user.role !== "renter")
    return res.status(403).json({ error: "Only renters can upload listing photos" });

  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: "No files uploaded" });

  try {
    const photoAssets = await Promise.all(
      files.map((file) => processAndUploadImage(file.buffer, { folder: "roomie/properties" }))
    );
    res.status(201).json({ photoAssets });
  } catch (err) {
    console.error("Photo upload failed:", err.message);
    res.status(400).json({ error: `Could not process one of the uploaded images: ${err.message}` });
  }
};
