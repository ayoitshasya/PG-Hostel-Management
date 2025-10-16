// RoomieHome.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function RoomieHome() {
  return (
    <div className="min-h-[80vh] flex flex-col bg-[#ffffff] text-slate-800">
      
      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-lg">
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1564078516393-cf04bd966897?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1600"
            alt="PG Room"
            className="w-full h-[420px] md:h-[500px] object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-6 md:p-12">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              Find Your Perfect Room
            </h1>
            <p className="text-base md:text-lg max-w-2xl text-gray-200 mb-6">
              Discover comfortable and affordable PG accommodations tailored to your needs.
              Whether you’re a student or a working professional, we have the perfect space for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/find"
                className="px-6 py-3 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600"
              >
                Find a PG
              </Link>
              <Link
                to="/list"
                className="px-6 py-3 bg-white text-slate-800 rounded-lg font-semibold hover:bg-gray-100"
              >
                List Your PG
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
