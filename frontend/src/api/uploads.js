// Uploads listing photos for the CreateListing form. Ordinary JSON can't
// carry actual binary image files, so this builds a `multipart/form-data`
// request (via the browser's FormData API) instead - that's the standard
// way to send files over HTTP.
import API from "./api";

// `files` is an array of File objects straight from an <input type="file">.
// onProgress receives a 0-100 percentage as the browser uploads the
// multipart request body, so the UI can show a progress bar for what's
// often a slow request (real photos, upload bandwidth).
export async function uploadPropertyPhotos(files, onProgress) {
  const form = new FormData();
  // Same field name ("photos") repeated for each file - multer on the
  // backend reads this as an array of files under that one field.
  files.forEach((file) => form.append("photos", file));

  const res = await API.post("/uploads/photos", form, {
    // Axios calls this repeatedly as the upload progresses; e.loaded/e.total
    // are bytes sent so far vs. total bytes to send.
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  // The backend processes each photo (resize/strip metadata/upload to
  // Cloudinary - see backend/lib/imagePipeline.js) and returns the saved
  // asset records, not the raw files.
  return res.data.photoAssets;
}
