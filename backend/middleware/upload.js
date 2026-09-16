// Configures multer, the Express middleware that parses incoming
// multipart/form-data requests (i.e. actual file uploads, not JSON) and
// makes the uploaded files available as req.files in the route handler.
// This is used by the POST /api/uploads/photos route.
const multer = require("multer");

const MAX_FILE_SIZE_MB = 8;
const MAX_FILES = 8;
// A Set (rather than an array) just for fast `.has()` lookups below.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// This mimetype check is a fast, cheap first filter based on what the
// client claims the file is - it's spoofable, so it's not the real
// security boundary. The real validation is imagePipeline.js actually
// parsing the file with sharp; a renamed .exe with a fake image/jpeg
// mimetype will pass this filter but fail there instead.
const upload = multer({
  // Keeps uploaded files in memory (as Buffers) rather than writing them
  // to disk - fine here since files are small and get forwarded straight
  // to Cloudinary rather than stored locally.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  // Called once per uploaded file before it's accepted; call cb(err) to
  // reject it, or cb(null, true) to allow it through.
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`));
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_FILE_SIZE_MB, MAX_FILES };
