// Site-wide top navigation bar. Rendered once around every route (see
// App.jsx) so it stays sticky/visible while the page content underneath
// changes. Shows different links depending on whether someone is logged
// in, and if so, whether they're a renter or a tenant.
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContextObject";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  // useContext reads shared state from AuthContext (set up in
  // AuthContext.jsx) without having to pass `user`/`logout` down as props
  // through every component in between - any component can "tune in" to
  // this context the same way.
  const { user, logout } = useContext(AuthContext);
  // useNavigate gives us a function to programmatically change the route
  // (as opposed to <Link>, which only navigates on a click).
  const nav = useNavigate();

  function handleLogout() {
    logout(); // clears the stored user/token (see AuthContext.jsx)
    nav("/"); // send them back to the home page
  }

  return (
    <header className="bg-surface/95 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        {/* Left Section — Brand & Navigation */}
        <div className="flex items-center space-x-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-accent font-bold text-lg tracking-tight hover:opacity-90"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14 10.5 9.5 6 8l4.5-1.5L12 2z"
                fill="currentColor"
              />
            </svg>
            Roomie
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-[15px] text-fg-secondary">
            <Link
              to="/"
              className="hover:text-fg transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/create-listing"
              className="hover:text-fg transition-colors duration-200"
            >
              List Your PG
            </Link>
          </nav>
        </div>

        {/* Right Section — Auth Buttons */}
        <div className="flex items-center space-x-3 text-sm">
          <ThemeToggle />
          {/* `user ? (...) : (...)` is a ternary used as an if/else inside JSX:
              logged-in visitors see their name + dashboard link + logout,
              everyone else sees Login/Sign Up links instead. */}
          {user ? (
            <>
              <span className="text-fg-secondary hidden sm:inline font-medium">
                Hi, {user.name}
              </span>

              {/* Renters and tenants have different dashboards, so pick the
                  right link based on the logged-in user's role. */}
              {user.role === "renter" ? (
                <Link
                  to="/renter-dashboard"
                  className="text-fg-secondary hover:text-fg transition-colors duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/tenant-dashboard"
                  className="text-fg-secondary hover:text-fg transition-colors duration-200"
                >
                  My Requests
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-fg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-fg-secondary hover:text-fg transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="ml-2 px-4 py-1.5 rounded-sm bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-all duration-200 shadow-sm inline-block"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
