// Defines the /api/properties routes: two public read endpoints (browse +
// single listing) and three authenticated write endpoints (create/update/
// delete), each wired to the matching function in controllers/propertyController.js.

const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middleware/authMiddleware');

// Cache-Control on the two public read endpoints only - not the
// authenticated write routes, and not per-user data anywhere else in the
// app. `public` allows shared/CDN caches to store it, not just the
// browser. Search results (many different filter combinations, each
// cached separately by URL) get a short 60s window; a single listing's
// detail page changes less often once published, so gets 5 minutes.
// stale-while-revalidate lets a cache serve one slightly-stale response
// immediately while it re-fetches in the background, instead of every
// visitor after expiry waiting on a fresh network round trip.
function cacheControl(value) {
  // Returns an Express middleware function. This is a small factory so the
  // same logic can be reused with two different cache durations below,
  // instead of writing two nearly-identical middleware functions by hand.
  return (req, res, next) => {
    res.set('Cache-Control', value);
    next(); // hand off to the next middleware/controller in the chain
  };
}

// public listing + filters
router.get('/', cacheControl('public, max-age=60, stale-while-revalidate=30'), propertyController.list);
router.get('/:id', cacheControl('public, max-age=300, stale-while-revalidate=60'), propertyController.getById);

// protected create/update/delete - authMiddleware runs first and blocks
// the request with a 401 if there's no valid logged-in user.
router.post('/', authMiddleware, propertyController.create);
router.put('/:id', authMiddleware, propertyController.update);
router.delete('/:id', authMiddleware, propertyController.remove);

module.exports = router;
