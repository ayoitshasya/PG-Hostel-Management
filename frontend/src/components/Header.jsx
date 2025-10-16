import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/");
  }

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        {/* Left Section — Brand & Navigation */}
        <div className="flex items-center space-x-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight hover:opacity-90"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14 10.5 9.5 6 8l4.5-1.5L12 2z"
                fill="#13a3e9"
              />
            </svg>
            Roomie
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-[15px] text-gray-600">
            <Link
              to="/"
              className="hover:text-primary transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/create-listing"
              className="hover:text-primary transition-colors duration-200"
            >
              List Your PG
            </Link>
          </nav>
        </div>

        {/* Right Section — Auth Buttons */}
        <div className="flex items-center space-x-3 text-sm">
          {user ? (
            <>
              <span className="text-gray-700 hidden sm:inline font-medium">
                Hi, {user.name}
              </span>

              {user.role === "renter" ? (
                <Link
                  to="/renter-dashboard"
                  className="text-gray-700 hover:text-primary transition-colors duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/tenant-dashboard"
                  className="text-gray-700 hover:text-primary transition-colors duration-200"
                >
                  My Requests
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary transition-colors duration-200"
              >
                Login
              </Link>
              <Link to="/signup" className="inline-block">
                <button className="ml-2 px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:brightness-95 transition-all duration-200 shadow-sm">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
