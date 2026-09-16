// The public landing page ("/"). A single full-width hero image with a
// headline and two calls-to-action: browse listings, or list a property.
import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col bg-bg">
      <Seo
        title="PG, Hostel & Apartment Rentals"
        description="Find and list PGs, hostels, and shared apartments. Search by city, price, and amenities, or list your own property in minutes."
      />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="relative w-full max-w-6xl rounded-md overflow-hidden shadow-xl">
          {/* This is the largest image on the page and almost always visible
              without scrolling, so it's loaded eagerly and marked
              high-priority instead of the usual lazy-loading - waiting to
              discover it would delay the page's Largest Contentful Paint. */}
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.1.0&auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="w-full h-[420px] md:h-[500px] object-cover"
            width="1600"
            height="500"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 flex flex-col items-center justify-center text-center text-white p-6 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Room
            </h1>
            <p className="text-base md:text-lg max-w-2xl text-neutral-100 mb-8">
              Discover comfortable and affordable PG accommodations tailored to your needs.
              Whether you're a student or a working professional, we have the perfect space for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/find"
                className="px-8 py-3 bg-accent text-accent-fg rounded-sm font-semibold hover:bg-accent-hover transition"
              >
                Find a PG
              </Link>
              {/* Fixed (not theme-token) colors deliberately - this button
                  sits on a dark photo scrim, not page chrome, in both
                  light and dark site mode. bg-surface/text-fg would turn
                  this into a near-black button on a near-black scrim in
                  dark mode, since --surface is dark there too. */}
              <Link
                to="/create-listing"
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/40 rounded-sm font-semibold transition"
              >
                List Your PG
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
