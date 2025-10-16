// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 text-center py-6 text-sm text-gray-500">
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
