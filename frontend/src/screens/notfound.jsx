import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-8">
        The page you are looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary-dark text-white rounded-lg hover:bg-primary transition"
      >
        Back to Home
      </Link>
    </div>
  );
}