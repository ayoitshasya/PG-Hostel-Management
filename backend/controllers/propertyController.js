// Controller functions for Properties - the actual PG/hostel/apartment
// listings. Covers the public search/browse endpoints (list, getById) and
// the authenticated create/update/delete endpoints used by renters to
// manage their own listings.

const Property = require("../models/Property");
const { deletePhotoAssets } = require("../lib/imagePipeline");

// GET /api/properties - the main search/browse endpoint. Public (no login
// required). Every query param is optional; whichever ones are present get
// combined into a single MongoDB filter object. Supports pagination via
// page/limit.
exports.list = async (req, res) => {
  try {
    const {
      amenities,
      minPrice,
      maxPrice,
      audience,
      propertyType,
      city,
      furnishing,
      status,
      query,  // ← Changed from 'q' to match frontend
      page = 1,
      limit = 20,
    } = req.query;

    console.log("Received query params:", req.query);

    // `filter` starts empty and only gets a key added for each param the
    // caller actually sent - an unfiltered GET /api/properties returns
    // everything.
    const filter = {};

    if (amenities) {
      // Stored amenities are always lowercase (Property model normalizes
      // on save) - lowercase the incoming filter too so "WiFi" and "wifi"
      // both match. Belt-and-suspenders: the frontend now fetches
      // canonical lowercase values from GET /api/meta/options, so this
      // shouldn't be reachable with mismatched casing, but a stale client
      // or hand-crafted request still gets a correct match.
      const arr = String(amenities)
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      // $all means the listing must have EVERY amenity in the array, not
      // just any one of them - a strict "must have wifi AND parking" filter.
      if (arr.length) filter.amenities = { $all: arr };
    }

    // minPrice/maxPrice build up the same `filter.price` object with
    // MongoDB's $gte (greater-or-equal) / $lte (less-or-equal) operators -
    // if both are given, both conditions apply together (a price range).
    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };

    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    if (audience) filter.targetAudience = audience;

    if (propertyType) filter.propertyType = propertyType;

    if (city) filter.city = city;

    if (furnishing) filter.furnishing = furnishing;

    if (status) filter.status = status;

    // Free-text search across title/description/address. $regex with the
    // 'i' option does a case-insensitive "contains" match (simpler than
    // MongoDB's built-in $text search, no text index required). $or means
    // a listing matches if ANY of the three fields contains the query.
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.address': { $regex: query, $options: 'i' } }
      ];
    }

    console.log("Applied filter:", JSON.stringify(filter));

    // Standard "skip + limit" pagination: page 1 skips 0 documents, page 2
    // skips `limit` documents, page 3 skips `2 * limit`, and so on.
    const skip = (Number(page) - 1) * Number(limit);
    const results = await Property.find(filter)
      // Replaces the owner ObjectId with the actual user fields listed here
      // (so the frontend can show "listed by <name>" without a second call).
      .populate("owner", "name email phone avatarUrl")
      .skip(skip)
      .limit(Number(limit))
      .exec();

    console.log(`Found ${results.length} properties`);

    res.json({ results });
  } catch (error) {
    console.error("List properties error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/properties/:id - fetch one listing's full details. Public.
exports.getById = async (req, res) => {
  const prop = await Property.findById(req.params.id).populate(
    "owner",
    "name email phone avatarUrl"
  );
  if (!prop) return res.status(404).json({ error: "Property not found" });
  res.json(prop);
};

// POST /api/properties - create a new listing. Requires login AND the
// "renter" role (tenants can't create listings).
exports.create = async (req, res) => {
  if (req.user.role !== "renter")
    return res.status(403).json({ error: "Only renters can create listings" });

  const payload = req.body;
  // totalRooms is a derived/summary field - keep it in sync with the actual
  // rooms array length rather than trusting whatever the client sent.
  if (payload.rooms && Array.isArray(payload.rooms))
    payload.totalRooms = payload.rooms.length;

  const prop = await Property.create({
    // owner is set from the authenticated user, never from the request body
    // - otherwise a renter could create a listing "owned by" someone else.
    owner: req.user._id,
    ...payload,
  });

  res.status(201).json(prop);
};

// PUT /api/properties/:id - update an existing listing. Requires login AND
// being the listing's owner (checked below, not just "any renter").
exports.update = async (req, res) => {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).json({ error: "Property not found" });
  // Ownership check: compare the property's stored owner id against the
  // logged-in user's id. Both are converted to strings first because
  // MongoDB ObjectIds aren't `===`-comparable directly even when equal.
  if (prop.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Forbidden: not the owner" });

  // Object.assign copies every field from the request body onto the
  // existing document, overwriting only what was sent (partial updates
  // are fine - you don't have to resend the whole listing).
  Object.assign(prop, req.body);
  if (prop.rooms) prop.totalRooms = prop.rooms.length;
  await prop.save();
  res.json(prop);
};

// DELETE /api/properties/:id - delete a listing. Same ownership check as
// update. Also cleans up any photos that were uploaded to Cloudinary for
// this listing, so deleting a property doesn't leave orphaned image files
// behind in cloud storage.
exports.remove = async (req, res) => {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).json({ error: "Property not found" });
  if (prop.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Forbidden: not the owner" });

  if (prop.photoAssets && prop.photoAssets.length) {
    await deletePhotoAssets(prop.photoAssets);
  }

  await prop.deleteOne();
  res.json({ success: true });
};
