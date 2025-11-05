import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col bg-white">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="relative w-full max-w-6xl rounded-2xl overflow-hidden shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.1.0&auto=format&fit=crop&w=1600&q=80"
            alt="Room"
            className="w-full h-[420px] md:h-[500px] object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 flex flex-col items-center justify-center text-center text-white p-6 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Room
            </h1>
            <p className="text-base md:text-lg max-w-2xl text-gray-100 mb-8">
              Discover comfortable and affordable PG accommodations tailored to your needs.
              Whether you're a student or a working professional, we have the perfect space for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/find"
                className="px-8 py-3 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition"
              >
                Find a PG
              </Link>
              <Link
                to="/create-listing"
                className="px-8 py-3 bg-white text-slate-800 rounded-lg font-semibold hover:bg-gray-100 transition"
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