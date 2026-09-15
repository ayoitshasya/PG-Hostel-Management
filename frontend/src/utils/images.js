// Reads a property's primary photo, preferring the new pipeline-uploaded
// `photoAssets` (real WebP variants at several widths, so we can build a
// srcset) and falling back to the older plain `photos` URL strings (no
// variants - existing data and manually-pasted URLs still work, just
// without srcset).
export function getPrimaryPhoto(property) {
  const asset = property?.photoAssets?.[0];
  if (asset?.variants?.length) {
    const sorted = [...asset.variants].sort((a, b) => a.width - b.width);
    const largest = sorted[sorted.length - 1];
    return {
      src: largest.url,
      srcSet: sorted.map((v) => `${v.url} ${v.width}w`).join(", "),
      width: asset.width,
      height: asset.height,
    };
  }

  const url = property?.photos?.[0];
  if (url) {
    return { src: url, srcSet: undefined, width: undefined, height: undefined };
  }

  return null;
}
