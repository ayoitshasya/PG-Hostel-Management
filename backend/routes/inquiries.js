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
