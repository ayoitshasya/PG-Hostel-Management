// This is Express "middleware" - a function that runs before a route
// handler and can either let the request continue (by calling `next()`)
// or stop it short (by sending a response itself, like the 401s below).
// This particular middleware checks that the request has a valid login
// token, and if so, attaches the logged-in user to `req.user` so later
// route handlers (in controllers/) can use it.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT = JSON Web Token, a signed string issued at login (see
// authController.js) that proves "this request is from user X" without
// needing a database lookup on every single request just to check who's
// asking. It's signed with this secret so it can't be forged - anyone
// without JWT_SECRET can't create a token that passes jwt.verify below.
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Runs on every route that requires the user to be logged in (wired up in
// the route files, e.g. `router.post('/', authMiddleware, createProperty)`).
async function authMiddleware(req, res, next) {
  // Expects an "Authorization: Bearer <token>" header, set automatically
  // by the frontend's Axios instance (see frontend/src/api/api.js).
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  try {
    // Strip the "Bearer " prefix (7 characters) to get just the token.
    const token = auth.slice(7);
    // Verifies the token's signature and expiry, and decodes its payload
    // (the { id, role, email } that was signed in at login). Throws if
    // the token is invalid, expired, or tampered with.
    const payload = jwt.verify(token, JWT_SECRET);
    // Look up the full, current user record (so role/name/etc. reflect the
    // latest database state, not just what was baked into the token at
    // login time). `.select('-passwordHash')` excludes the password hash
    // from the result, since we never want to pass that further downstream.
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    // Attach the user to the request object so route handlers can read
    // req.user.id / req.user.role directly.
    req.user = user;
    // Everything checked out - let the request continue to its route handler.
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
