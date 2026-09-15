import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContextObject";

export default function ProtectedRoute({
  allowedRoles = [],
  children = null,
}) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return children ? children : <Outlet />;
  }

  const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());
  const userRole = String(user.role || "").toLowerCase();

  if (!normalizedAllowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}