// Defines the /api/auth routes. A route file's job is just to say "when a
// request with this HTTP method and path comes in, run this controller
// function" - the actual logic lives in controllers/authController.js.
// Both routes here are public (no auth middleware) since you need to be
// able to sign up / log in before you have a token.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;
