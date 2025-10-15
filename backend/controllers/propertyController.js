const Property = require('../models/Property');

// List properties with filters
exports.list = async (req, res) => {
  const { amenities, minPrice, maxPrice, audience, propertyType, furnishing, status, q, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (amenities) {
    const arr = String(amenities).split(',').map(a => a.trim()).filter(Boolean);
    if (arr.length) filter.amenities = { $all: arr };
  }
  if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  if (audience) filter.targetAudience = audience;
  if (propertyType) filter.propertyType = propertyType;
  if (furnishing) filter.furnishing = furnishing;
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);
  const results = await Property.find(filter)
    .populate('owner', 'name email phone avatarUrl')
    .skip(skip)
    .limit(Number(limit))
    .exec();

  res.json({ results });
};

// Get by ID
exports.getById = async (req, res) => {
  const prop = await Property.findById(req.params.id).populate('owner', 'name email phone avatarUrl');
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  res.json(prop);
};

// Create property (renter only)
exports.create = async (req, res) => {
  if (req.user.role !== 'renter') return res.status(403).json({ error: 'Only renters can create listings' });

  const payload = req.body;
  if (payload.rooms && Array.isArray(payload.rooms)) payload.totalRooms = payload.rooms.length;

  const prop = await Property.create({
    owner: req.user._id,
    ...payload
  });

  res.status(201).json(prop);
};

// Update property (owner only)
exports.update = async (req, res) => {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  if (prop.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden: not the owner' });

  Object.assign(prop, req.body);
  if (prop.rooms) prop.totalRooms = prop.rooms.length;
  await prop.save();
  res.json(prop);
};

// Delete property (owner only)
exports.remove = async (req, res) => {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  if (prop.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden: not the owner' });

  await prop.remove();
  res.json({ success: true });
};
