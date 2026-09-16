// Defines GET /api/meta/options - a single public endpoint that returns the
// canonical lists of allowed values (property types, cities, amenities,
// etc.) from constants/listingOptions.js. This exists so the frontend
// doesn't have to hardcode its own copy of these lists in two places
// (Find.jsx's filters and CreateListing.jsx's form) - both fetch this
// endpoint instead, so the two always agree and only ever need to be edited
// in one place (the constants file).

const express = require("express");
const router = express.Router();
const { PROPERTY_TYPES, CITIES, AUDIENCES, FURNISHING, STATUSES, AMENITIES } = require("../constants/listingOptions");

// Public, static, rarely-changing - safe to cache client-side for a while.
// Find.jsx and CreateListing fetch this instead of hardcoding their own
// copy of the allowed values.
router.get("/options", (req, res) => {
  // Cache-Control tells the browser (and any CDN in front of it) it can
  // reuse this response for up to 3600 seconds (1 hour) without asking the
  // server again - safe here because these option lists rarely change.
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ propertyTypes: PROPERTY_TYPES, cities: CITIES, audiences: AUDIENCES, furnishing: FURNISHING, statuses: STATUSES, amenities: AMENITIES });
});

module.exports = router;
