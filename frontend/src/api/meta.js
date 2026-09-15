import API from "./api";

// GET /api/meta/options is public, static, and rarely changes - cache the
// promise at module scope so every component that needs it (Find,
// CreateListing, ListingCard, ListingDetail) shares one request instead of
// each firing its own on mount.
let cachedPromise = null;

export function fetchListingOptions() {
  if (!cachedPromise) {
    cachedPromise = API.get("/meta/options")
      .then((res) => res.data)
      .catch((err) => {
        cachedPromise = null; // allow a retry on the next call if this one failed
        throw err;
      });
  }
  return cachedPromise;
}

// Maps a stored amenity slug ("power-backup") to its display label
// ("Power Backup") using the fetched options. Falls back to the raw slug
// if it's not in the list (e.g. stale data with a value no longer
// offered), so display never silently drops something a listing has.
export function amenityLabel(options, slug) {
  const match = (options?.amenities || []).find((a) => a.value === slug);
  return match ? match.label : slug;
}
