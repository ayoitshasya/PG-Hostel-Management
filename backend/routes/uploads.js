const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, MAX_FILE_SIZE_MB, MAX_FILES } = require("../middleware/upload");

router.post("/photos", authMiddleware, (req, res, next) => {
  upload.array("photos", MAX_FILES)(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ error: `File too large - max ${MAX_FILE_SIZE_MB}MB per photo.` });
    if (err.code === "LIMIT_FILE_COUNT")
      return res.status(400).json({ error: `Too many files - max ${MAX_FILES} photos per upload.` });
    return res.status(400).json({ error: err.message || "Upload failed" });
  });
}, uploadController.uploadPhotos);

module.exports = router;
