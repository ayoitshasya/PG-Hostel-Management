// Route guard component. Wraps routes in App.jsx that should only be
// reachable by logged-in users (and optionally, only certain roles) - e.g.
// /create-listing should only be reachable by a "renter". This is the
// frontend half of the auth check; the backend also re-checks
// req.user.role independently (see backend/controllers), since a
// frontend-only check can always be bypassed by someone hitting the API
// directly.
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContextObject";

// `allowedRoles`: e.g. ["renter"] - if empty, any logged-in user is fine.
// `children`: used when this component wraps a single route element
// directly; if omitted, <Outlet /> renders whatever nested route matched
// (React Router's way of saying "render the child route here").
export default function ProtectedRoute({
  allowedRoles = [],
  children = null,
}) {
  const { user, loading } = useContext(AuthContext);

  // AuthContext hasn't finished checking localStorage for a saved
  // token/user yet - show a placeholder instead of briefly flashing the
  // "not logged in" redirect before we actually know.
  if (loading) {
    return (
      <div className="p-6 text-center text-fg-secondary">
        Checking authentication...
      </div>
    );
  }

  // No logged-in user at all -> bounce to the login page.
  // `replace` swaps the current history entry instead of pushing a new
  // one, so hitting the browser's Back button doesn't return to this
  // protected route and immediately redirect again.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // No specific role required - being logged in is enough.
  if (!allowedRoles || allowedRoles.length === 0) {
    return children ? children : <Outlet />;
  }

  // Compare case-insensitively so "Renter"/"renter"/"RENTER" all match.
  const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());
  const userRole = String(user.role || "").toLowerCase();

  // Logged in, but wrong role for this route (e.g. a tenant hitting a
  // renter-only page) -> send them to the home page instead.
  if (!normalizedAllowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Passed every check - render the protected content.
  return children ? children : <Outlet />;
}