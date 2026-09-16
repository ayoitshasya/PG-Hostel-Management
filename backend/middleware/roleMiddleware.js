// A reusable piece of middleware for restricting a route to specific
// user roles (e.g. only "renter" accounts can create a listing). Must run
// *after* authMiddleware, since it relies on req.user already being set.
//
// Note: this file exists but isn't actually wired into the route files
// yet - the route handlers in controllers/ currently do their own inline
// `if (req.user.role !== '...')` checks instead. See the README's Known
// Limitations section. It's kept here as the intended, reusable version.

// `requireRole` is a "factory" function: you call it with the roles you
// want to allow (e.g. requireRole('renter')), and it returns the actual
// Express middleware function Express will run for that route.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    // 403 Forbidden = "we know who you are, but you're not allowed to do
    // this" (as opposed to 401 Unauthorized, which means "we don't know
    // who you are at all").
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { requireRole };
