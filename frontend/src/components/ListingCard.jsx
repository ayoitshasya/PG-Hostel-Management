import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getPrimaryPhoto } from "../utils/images";
import { amenityLabel } from "../api/meta";
import useListingOptions from "../hooks/useListingOptions";

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
  const { options } = useListingOptions();
  const photo = getPrimaryPhoto(property);
  const price = property.price ?? property.rooms?.[0]?.price ?? null;
  const priceLabel = price ? `${property.currency ?? "INR"} ${price}` : "Price N/A";
  const subtitle = property.description || property.propertyType || "";

  return (
    // `group` lets the image react to hover/focus on the whole card (the
    // Link IS the card - there's no separate wrapper to hang the state on).
    // The single interaction spec'd for this card: image scales slightly
    // within its clipped frame, the card gains elevation and an
    // accent-tinted border - on hover AND keyboard focus identically
    // (group-focus-visible, not group-focus, so it doesn't fire on a mouse
    // click that happens to focus the link). border-transparent at rest
    // keeps the border reserved in layout, so it appearing on hover/focus
    // doesn't shift anything. The scale transform is the only piece gated
    // behind motion-safe: - a shadow/border change isn't the kind of
    // motion prefers-reduced-motion is about, but scaling content is.
    <Link
      to={`/listing/${property._id}`}
      className="group block bg-surface rounded-md border border-transparent shadow-sm hover:shadow-md hover:border-accent focus-visible:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-[box-shadow,border-color] duration-200 overflow-hidden"
    >
      <div className="w-full h-44 md:h-40 lg:h-44 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {photo && !imgError ? (
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes={photo.srcSet ? CARD_SIZES : undefined}
            alt={property.title}
            className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105"
            width="640"
            height="352"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-fg-secondary">
            No Image
          </div>
        )}
      </div>

      <div className="p-3.5">
        <HeadingTag className="font-semibold text-fg text-base line-clamp-2">
          {property.title}
        </HeadingTag>

        <p className="text-sm text-fg-secondary mt-1 line-clamp-2">{subtitle}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-fg-secondary">
            {property.targetAudience && (
              <span className="inline-block mr-2 px-2 py-0.5 text-xs rounded-sm bg-neutral-100 dark:bg-neutral-800">
                {property.targetAudience}
              </span>
            )}
            <span className="text-sm font-medium text-fg">{priceLabel}</span>
          </div>

          <div className="text-xs text-fg-secondary">
            {property.totalRooms ?? ""} rooms
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(property.amenities || []).slice(0, 3).map((a) => (
            <span
              key={a}
              className="text-xs text-fg-secondary bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-sm"
            >
              {amenityLabel(options, a)}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
