// src/components/Header.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav('/');
  }

  return (
    <header className="bg-white border-b">
      <div className="container-centered flex items-center justify-between h-16">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-primary font-bold text-lg">Roomie</Link>

          <nav className="hidden md:flex space-x-4 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/create-listing" className="hover:text-primary">List Your PG</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <span className="text-sm text-gray-700 hidden sm:inline">Hi, {user.name}</span>

              {user.role === 'renter' ? (
                <Link to="/renter-dashboard" className="text-sm text-gray-700 hover:text-primary">Dashboard</Link>
              ) : (
                <Link to="/tenant-dashboard" className="text-sm text-gray-700 hover:text-primary">My Requests</Link>
              )}

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1 rounded-md bg-gray-100 text-sm hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:text-primary">Login</Link>
              <Link to="/signup" className="inline-block">
                <button className="ml-2 px-3 py-1 rounded-md bg-primary text-white text-sm hover:brightness-95">
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
