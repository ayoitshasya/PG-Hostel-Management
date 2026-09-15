import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getPrimaryPhoto } from "../utils/images";

// Card is up to 1/3 of the viewport width on large screens (grid-cols-3),
// 1/2 on medium (grid-cols-2), full width below that - matches the grid
// classes in Find.jsx so the browser picks an accurately-sized variant.
const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

// priority: set true only for the single card most likely to be the page's
// LCP (largest contentful paint) element - e.g. the first card above the
// fold - so it loads eagerly and with high fetch priority. Every other
// card stays lazy so the browser doesn't compete for bandwidth loading
// images the user hasn't scrolled to yet.
//
// headingLevel: which heading tag wraps the card title, since this card
// gets used directly under a page's h1 in some screens (RenterDashboard)
// and under an h2 section heading in others (Find's "Recommended"/
// "Results") - callers pass whichever keeps the page's heading order
// unbroken (no skipped levels) for their context.
export default function ListingCard({ property, priority = false, headingLevel = 3 }) {
  const HeadingTag = `h${headingLevel}`;
  const [imgError, setImgError] = useState(false);
  const photo = getPrimaryPhoto(property);
  const price = property.price ?? property.rooms?.[0]?.price ?? null;
  const priceLabel = price ? `${property.currency ?? "INR"} ${price}` : "Price N/A";
  const subtitle = property.description || property.propertyType || "";

  return (
    <Link
      to={`/listing/${property._id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark transition-all overflow-hidden"
    >
      <div className="w-full h-44 md:h-40 lg:h-44 bg-gray-100">
        {photo && !imgError ? (
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes={photo.srcSet ? CARD_SIZES : undefined}
            alt={property.title}
            className="w-full h-full object-cover"
            width="640"
            height="352"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <HeadingTag className="font-semibold text-slate-900 text-base line-clamp-2">
          {property.title}
        </HeadingTag>

        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{subtitle}</p>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600">
            {property.targetAudience && (
              <span className="inline-block mr-2 px-2 py-0.5 text-xs rounded bg-slate-100">
                {property.targetAudience}
              </span>
            )}
            <span className="text-sm font-medium">{priceLabel}</span>
          </div>

          <div className="text-xs text-slate-500">
            {property.totalRooms ?? ""} rooms
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(property.amenities || []).slice(0, 3).map((a) => (
            <span
              key={a}
              className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
