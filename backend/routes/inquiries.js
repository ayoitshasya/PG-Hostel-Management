// Defines the /api/inquiries routes. Every route here passes through the
// `auth` middleware first - it checks the Authorization header for a valid
// JWT and attaches the logged-in user to req.user before the controller
// runs. If there's no valid token, auth middleware stops the request before
// it ever reaches the controller.

const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const auth = require('../middleware/authMiddleware');

// tenant creates inquiry
router.post('/', auth, inquiryController.create);

// renter lists inquiries for their properties
router.get('/', auth, inquiryController.listForOwner);

// tenant can view their sent inquiries
router.get('/my', auth, inquiryController.listForTenant);

// update status by owner
router.put('/:id/status', auth, inquiryController.updateStatus);

module.exports = router;
