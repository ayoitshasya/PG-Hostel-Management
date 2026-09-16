const Property = require("../models/Property");
const { deletePhotoAssets } = require("../lib/imagePipeline");

// List properties with filters
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
      if (arr.length) filter.amenities = { $all: arr };
    }

    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    
    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    
    if (audience) filter.targetAudience = audience;
    
    if (propertyType) filter.propertyType = propertyType;

    if (city) filter.city = city;

    if (furnishing) filter.furnishing = furnishing;
    
    if (status) filter.status = status;
    
    // Use regex instead of $text for simpler search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.address': { $regex: query, $options: 'i' } }
      ];
    }

    console.log("Applied filter:", JSON.stringify(filter));

    const skip = (Number(page) - 1) * Number(limit);
    const results = await Property.find(filter)
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

// Get by ID
exports.getById = async (req, res) => {
  const prop = await Property.findById(req.params.id).populate(
    "owner",
    "name email phone avatarUrl"
  );
  if (!prop) return res.status(404).json({ error: "Property not found" });
  res.json(prop);
};

// Create property (renter only)
exports.create = async (req, res) => {
  if (req.user.role !== "renter")
    return res.status(403).json({ error: "Only renters can create listings" });

  const payload = req.body;
  if (payload.rooms && Array.isArray(payload.rooms))
    payload.totalRooms = payload.rooms.length;

  const prop = await Property.create({
    owner: req.user._id,
    ...payload,
  });

  res.status(201).json(prop);
};

// Update property (owner only)
exports.update = async (req, res) => {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).json({ error: "Property not found" });
  if (prop.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Forbidden: not the owner" });

  Object.assign(prop, req.body);
  if (prop.rooms) prop.totalRooms = prop.rooms.length;
  await prop.save();
  res.json(prop);
};

// Delete property (owner only)
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
