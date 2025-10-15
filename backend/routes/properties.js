const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middleware/authMiddleware');

// public listing + filters
router.get('/', propertyController.list);
router.get('/:id', propertyController.getById);

// protected create/update/delete
router.post('/', authMiddleware, propertyController.create);
router.put('/:id', authMiddleware, propertyController.update);
router.delete('/:id', authMiddleware, propertyController.remove);

module.exports = router;
