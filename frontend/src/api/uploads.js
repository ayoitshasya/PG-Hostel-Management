import API from "./api";

// onProgress receives a 0-100 percentage as the browser uploads the
// multipart request body.
export async function uploadPropertyPhotos(files, onProgress) {
  const form = new FormData();
  files.forEach((file) => form.append("photos", file));

  const res = await API.post("/uploads/photos", form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return res.data.photoAssets;
}
