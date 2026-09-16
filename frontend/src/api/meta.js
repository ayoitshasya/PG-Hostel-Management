// Fetches the canonical dropdown values (property types, cities, amenities,
// etc.) that both the "Find" search filters and the "Create Listing" form
// use, so those choices are defined once on the backend instead of being
// hardcoded (and able to drift out of sync) in multiple frontend files.
import API from "./api";

// GET /api/meta/options is public, static, and rarely changes - cache the
// promise at module scope so every component that needs it (Find,
// CreateListing, ListingCard, ListingDetail) shares one request instead of
// each firing its own on mount.
let cachedPromise = null;

// Returns the (possibly still in-flight) promise for /meta/options. Because
// `cachedPromise` lives outside the function (module scope), every caller
// across the whole app shares the SAME promise/request instead of each one
// triggering its own network call.
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
