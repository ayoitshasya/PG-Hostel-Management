// Defines POST /api/uploads/photos. This route is a bit more involved than
// the others because it needs multer (the file-upload middleware) to parse
// the incoming multipart/form-data request BEFORE the controller can see
// req.files, and multer's own errors (file too big, too many files) need to
// be caught and turned into friendly JSON responses rather than crashing.

const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, MAX_FILE_SIZE_MB, MAX_FILES } = require("../middleware/upload");

router.post("/photos", authMiddleware, (req, res, next) => {
  // upload.array("photos", MAX_FILES) is multer's parser for a field named
  // "photos" containing up to MAX_FILES files. It's called manually (with
  // its own callback) here instead of just listed as another middleware in
  // the chain, specifically so we can intercept multer's errors below and
  // reply with a clean { error: "..." } JSON body instead of Express's
  // default HTML error page.
  upload.array("photos", MAX_FILES)(req, res, (err) => {
    if (!err) return next(); // parsed fine - move on to uploadController.uploadPhotos
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ error: `File too large - max ${MAX_FILE_SIZE_MB}MB per photo.` });
    if (err.code === "LIMIT_FILE_COUNT")
      return res.status(400).json({ error: `Too many files - max ${MAX_FILES} photos per upload.` });
    return res.status(400).json({ error: err.message || "Upload failed" });
  });
}, uploadController.uploadPhotos);

module.exports = router;
