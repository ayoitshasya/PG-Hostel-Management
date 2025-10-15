const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');

// Tenant creates inquiry to a property
exports.create = async (req, res) => {
  // allow only tenant role to create inquiries (you can relax this if you want)
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can send inquiries' });

  const { propertyId, message } = req.body;
  if (!propertyId) return res.status(400).json({ error: 'propertyId required' });

  const prop = await Property.findById(propertyId);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const inquiry = await Inquiry.create({ property: prop._id, tenant: req.user._id, message });
  res.status(201).json(inquiry);
};

// Renter retrieves inquiries for their properties
exports.listForOwner = async (req, res) => {
  if (req.user.role !== 'renter') return res.status(403).json({ error: 'Only renters can view inquiries for their properties' });

  const owned = await Property.find({ owner: req.user._id }).select('_id');
  const propIds = owned.map(p => p._id);

  const inquiries = await Inquiry.find({ property: { $in: propIds } })
    .populate('tenant', 'name email phone avatarUrl')
    .populate('property', 'title price location status');

  res.json({ results: inquiries });
};

// Tenant can see their sent inquiries
exports.listForTenant = async (req, res) => {
  const inquiries = await Inquiry.find({ tenant: req.user._id })
    .populate('property', 'title price location status')
    .populate('tenant', 'name email');
  res.json({ results: inquiries });
};

// Update inquiry status (owner only)
exports.updateStatus = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate('property');
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  // only property owner can change status
  if (inquiry.property.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });

  inquiry.status = req.body.status || inquiry.status;
  await inquiry.save();
  res.json(inquiry);
};
