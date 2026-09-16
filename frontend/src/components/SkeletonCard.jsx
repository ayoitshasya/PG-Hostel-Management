import React from "react";

// "Skeleton" loading placeholder shaped like a real ListingCard (image +
// title + subtitle + price row). Rendered in a grid while property data is
// still being fetched (see Find.jsx/RenterDashboard.jsx), so the page
// shows a plausible loading shape instead of an empty area or spinner,
// and doesn't jump around once the real cards arrive.
export default function SkeletonCard() {
  return (
    // Tailwind's `animate-pulse` utility fades each block's opacity in and
    // out on a loop - the standard "shimmering placeholder" effect.
    <div className="animate-pulse bg-surface rounded-md shadow-sm overflow-hidden">
      <div className="w-full h-44 bg-neutral-200 dark:bg-neutral-700" /> {/* stands in for the listing photo */}
      <div className="p-3.5">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-3/4 mb-3"></div> {/* title-sized bar */}
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-2/3 mb-4"></div> {/* subtitle-sized bar */}
        <div className="flex justify-between">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/3"></div> {/* price-sized bar */}
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/6"></div> {/* room-count-sized bar */}
        </div>
      </div>
    </div>
  );
}
