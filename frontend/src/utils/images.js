// Small shared helper (not a component or hook) used by ListingCard,
// SkeletonCard, and ListingDetail wherever a listing's main photo needs to
// be displayed, so the "which photo field do we actually have" logic below
// only has to be written once.

// Reads a property's primary photo, preferring the new pipeline-uploaded
// `photoAssets` (real WebP variants at several widths, so we can build a
// srcset) and falling back to the older plain `photos` URL strings (no
// variants - existing data and manually-pasted URLs still work, just
// without srcset).
export function getPrimaryPhoto(property) {
  const asset = property?.photoAssets?.[0];
  if (asset?.variants?.length) {
    // Sort smallest-to-largest width so `srcSet` lists them in the order
    // browsers expect, and so "largest" (used as the plain fallback `src`
    // for browsers that ignore srcSet) is easy to grab as the last item.
    const sorted = [...asset.variants].sort((a, b) => a.width - b.width);
    const largest = sorted[sorted.length - 1];
    return {
      src: largest.url,
      // The srcSet attribute lets the browser itself pick whichever width
      // is most appropriate for the device/viewport, e.g.
      // "img400.webp 400w, img800.webp 800w, img1200.webp 1200w".
      srcSet: sorted.map((v) => `${v.url} ${v.width}w`).join(", "),
      width: asset.width,
      height: asset.height,
    };
  }

  // No pipeline-processed asset - fall back to an older, plain pasted URL
  // (no width variants available, so no srcSet).
  const url = property?.photos?.[0];
  if (url) {
    return { src: url, srcSet: undefined, width: undefined, height: undefined };
  }

  // Listing genuinely has no photos at all.
  return null;
}
