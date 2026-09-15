const express = require("express");
const router = express.Router();
const { PROPERTY_TYPES, AUDIENCES, FURNISHING, STATUSES, AMENITIES } = require("../constants/listingOptions");

// Public, static, rarely-changing - safe to cache client-side for a while.
// Find.jsx and CreateListing fetch this instead of hardcoding their own
// copy of the allowed values.
router.get("/options", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ propertyTypes: PROPERTY_TYPES, audiences: AUDIENCES, furnishing: FURNISHING, statuses: STATUSES, amenities: AMENITIES });
});

module.exports = router;
