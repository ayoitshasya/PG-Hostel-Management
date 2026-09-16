// src/components/Footer.jsx
//
// Simple, static site footer rendered on every page (see App.jsx). Has no
// state or props - it always renders the same links and copyright line.
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border text-center py-6 text-sm text-fg-secondary">
      <div className="flex justify-center space-x-6 mb-2">
        <Link to="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link to="/terms" className="hover:underline">
          Terms of Service
        </Link>
      </div>
      <p>© 2025 Roomie. All rights reserved.</p>
    </footer>
  );
}
