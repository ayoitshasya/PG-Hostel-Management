// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [], children = null }) {
  const { user, loading } = useContext(AuthContext);

  // debug
  // console.log("ProtectedRoute - allowed:", allowedRoles, "user:", user, "loading:", loading);

  // while auth loading, show neutral UI (prevents false redirect)
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Checking authentication...
      </div>
    );
  }

  // not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // if no allowedRoles specified, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    // support children if passed, else outlet
    return children ? children : <Outlet />;
  }

  // normalize roles for comparison
  const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
  const userRole = String(user.role || "").toLowerCase();

  if (!normalizedAllowed.includes(userRole)) {
    // role not allowed -> redirect to home (or show 403 page)
    return <Navigate to="/" replace />;
  }

  // allowed -> render children or outlet
  return children ? children : <Outlet />;
}
