const crypto = require("crypto");
const sharp = require("sharp");
const cloudinary = require("../config/cloudinary");

// Widths we generate a WebP variant for. A source image narrower than the
// smallest of these just gets one variant at its own width - we never
// upscale (sharp's `withoutEnlargement`).
const TARGET_WIDTHS = [400, 800, 1200];

function uploadBuffer(buffer, { folder, publicId, overwrite }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, overwrite, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Resizes one uploaded image into several WebP widths and stores each as a
// real file on Cloudinary (not a Cloudinary on-the-fly transform URL), so
// the resizing/format-conversion pipeline itself lives in our code.
// Auto-orients from EXIF, then strips metadata (sharp's default output
// behavior - EXIF/ICC/etc. aren't carried over unless withMetadata() is
// called, which we deliberately don't).
//
// baseId/overwrite are only passed by the seed script, to make reseeding
// idempotent (same listing+photo slot -> same public_id -> Cloudinary
// overwrites the old file instead of leaving an orphaned duplicate behind
// on every re-run). Real user uploads leave both at their defaults: a
// fresh random id each time, and overwrite:false as a safety net against
// ever clobbering another property's images.
async function processAndUploadImage(buffer, { folder, baseId, overwrite = false }) {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not read image dimensions - file may not be a valid image");
  }

  // EXIF orientations 5-8 mean the image is rotated 90/270 degrees, so the
  // *displayed* width/height are swapped relative to the raw pixel grid.
  const rotated = meta.orientation >= 5 && meta.orientation <= 8;
  const displayWidth = rotated ? meta.height : meta.width;
  const displayHeight = rotated ? meta.width : meta.height;

  const widths = TARGET_WIDTHS.filter((w) => w <= displayWidth);
  if (widths.length === 0) widths.push(displayWidth);

  const resolvedBaseId = baseId || crypto.randomUUID();

  const variants = await Promise.all(
    widths.map(async (targetWidth) => {
      const { data, info } = await sharp(buffer)
        .rotate() // auto-orient using EXIF, then drop the orientation tag
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });

      const result = await uploadBuffer(data, {
        folder,
        publicId: `${resolvedBaseId}-w${info.width}`,
        overwrite,
      });

      return { width: info.width, url: result.secure_url, publicId: result.public_id };
    })
  );

  // Largest-first makes the "primary" URL (variants[0]) sensible for any
  // code that only reads a single URL from this structure.
  variants.sort((a, b) => b.width - a.width);

  return { width: displayWidth, height: displayHeight, variants };
}

// Best-effort cleanup - failures are logged, not thrown, so one bad
// deletion doesn't block removing the Property document itself.
async function deletePhotoAssets(photoAssets) {
  const allVariants = (photoAssets || []).flatMap((asset) => asset.variants || []);
  const results = await Promise.allSettled(
    allVariants.map((v) => cloudinary.uploader.destroy(v.publicId))
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn(`Failed to delete Cloudinary asset ${allVariants[i].publicId}:`, r.reason?.message);
    }
  });
}

module.exports = { processAndUploadImage, deletePhotoAssets, TARGET_WIDTHS };
