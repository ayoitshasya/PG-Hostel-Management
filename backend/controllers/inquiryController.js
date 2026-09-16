// Controller functions for Inquiries - the messages a tenant sends to a
// renter about a specific listing ("Hi, is this still available?"). All of
// these run behind the `auth` middleware (see routes/inquiries.js), so
// req.user is always the logged-in user making the request.

const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');

// POST /api/inquiries - a tenant sends an inquiry about a property.
// Only tenants are allowed to create inquiries (renters don't inquire about
// their own listings). Expects { propertyId, message } in the body.
exports.create = async (req, res) => {
  // allow only tenant role to create inquiries (you can relax this if you want)
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can send inquiries' });

  const { propertyId, message } = req.body;
  if (!propertyId) return res.status(400).json({ error: 'propertyId required' });

  // Make sure the property actually exists before creating an inquiry that
  // points at it - avoids orphaned inquiries referencing a deleted/invalid id.
  const prop = await Property.findById(propertyId);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const inquiry = await Inquiry.create({ property: prop._id, tenant: req.user._id, message });
  res.status(201).json(inquiry);
};

// GET /api/inquiries - a renter views all inquiries sent about ANY of their
// properties (not just one listing). Two-step query: first find which
// properties this renter owns, then find inquiries pointing at any of those
// property ids.
exports.listForOwner = async (req, res) => {
  if (req.user.role !== 'renter') return res.status(403).json({ error: 'Only renters can view inquiries for their properties' });

  // Grab just the _id field (not the whole property document) since that's
  // all we need for the next query - keeps this lookup cheap.
  const owned = await Property.find({ owner: req.user._id }).select('_id');
  const propIds = owned.map(p => p._id);

  // $in matches any inquiry whose `property` field is one of propIds.
  // .populate() replaces the stored ObjectId references with the actual
  // tenant/property documents (just the listed fields), so the frontend
  // doesn't need a second round-trip to show the tenant's name or the
  // listing's title.
  const inquiries = await Inquiry.find({ property: { $in: propIds } })
    .populate('tenant', 'name email phone avatarUrl')
    .populate('property', 'title price location status');

  res.json({ results: inquiries });
};

// GET /api/inquiries/my - a tenant views the inquiries THEY sent, across all
// properties. Available to any logged-in user (no role check), since a
// renter account could in theory look this up for themselves too - it's
// naturally empty for a renter since they never send inquiries.
exports.listForTenant = async (req, res) => {
  const inquiries = await Inquiry.find({ tenant: req.user._id })
    .populate('property', 'title price location status')
    .populate('tenant', 'name email');
  res.json({ results: inquiries });
};

// PUT /api/inquiries/:id/status - update an inquiry's status
// (new -> contacted -> closed). Intended to be called by the renter who owns
// the property, but note: this does NOT currently check that req.user is
// actually that owner (see Known Limitations in the README) - anyone
// authenticated could update any inquiry's status by guessing/knowing its id.
exports.updateStatus = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate('property');
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  // Falls back to the existing status if the body didn't send a new one.
  inquiry.status = req.body.status || inquiry.status;
  await inquiry.save();
  res.json(inquiry);
};
