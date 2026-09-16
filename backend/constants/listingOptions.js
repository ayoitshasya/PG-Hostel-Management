// Single source of truth for every "allowed value" a Property listing can
// have. Used by the Property model (enum validation), the seed script, and
// exposed to the frontend via GET /api/meta/options - so Find.jsx and
// CreateListing never hardcode their own copy that can drift out of sync
// with what's actually stored (which is exactly how the amenities filter
// bug happened: three independent hardcoded lists, one lowercase, one
// capitalized, one with different words entirely).
//
// Kept in backend/ rather than a repo-root shared/ folder because the
// frontend and backend deploy as separate services (Vercel root=frontend/,
// Render root=backend/) - a root-level folder wouldn't be included in
// either build.

const PROPERTY_TYPES = ["PG", "Apartment", "Hostel"];

// Deliberately a fixed, small set rather than free text - Property.location.address
// stays free-text for display, but filtering needs a discrete field. Expanding
// this list later means an enum change here plus a migration for existing
// documents, same as any other value in this file.
const CITIES = ["Mumbai", "Hyderabad", "Pune", "Bangalore"];

const AUDIENCES = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "co-ed", label: "Co-ed" },
];

const FURNISHING = [
  { value: "furnished", label: "Furnished" },
  { value: "semi-furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "coming_soon", label: "Coming soon" },
];

// Values are lowercase and hyphenated - stored and matched exactly as
// written here. The Property model lowercases incoming amenity strings
// before validating against this list (see models/Property.js), so a
// client sending "WiFi" still gets normalized to "wifi" rather than
// rejected, but the canonical/displayed form is always this list.
const AMENITIES = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "parking", label: "Parking" },
  { value: "laundry", label: "Laundry" },
  { value: "ac", label: "AC" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "power-backup", label: "Power Backup" },
  { value: "lift", label: "Lift" },
  { value: "cctv", label: "CCTV" },
  { value: "refrigerator", label: "Refrigerator" },
  { value: "geyser", label: "Geyser" },
  { value: "tv", label: "TV" },
  { value: "gym", label: "Gym" },
];

module.exports = { PROPERTY_TYPES, CITIES, AUDIENCES, FURNISHING, STATUSES, AMENITIES };
