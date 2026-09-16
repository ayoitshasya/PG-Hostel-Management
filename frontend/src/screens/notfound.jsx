import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      {/* Note: this is client-side routing - the server still returns a
          real HTTP 200 for any unmatched path (it always serves
          index.html), not an actual 404 status. noindex is the only
          signal available to tell a crawler this page has no content;
          it can't correct the status code from here. */}
      <Seo title="Page Not Found" noindex />
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-fg-secondary mb-8">
        The page you are looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-accent text-accent-fg hover:bg-accent-hover rounded-sm transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}