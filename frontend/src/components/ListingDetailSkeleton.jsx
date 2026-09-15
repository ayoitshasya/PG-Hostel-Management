import React from "react";

// Mirrors ListingDetail's real grid/spacing classes (same max-w-7xl,
// grid-cols-1 lg:grid-cols-3, lg:col-span-2, gap-8, p-6) so it reserves
// roughly the same space at every breakpoint, instead of a generic
// centered "Loading..." message that's much shorter than the real page -
// that height mismatch was the actual cause of this page's CLS (the
// Footer jumping down once real content replaced a too-short placeholder).
// Sized with rem-based spacing (Tailwind's default scale) and an
// aspect-ratio for the hero image rather than a fixed pixel height, so it
// isn't tuned to one specific listing's content length.
export default function ListingDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
          <div className="w-full aspect-[8/5] bg-gray-200" />

          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
              <div className="h-8 bg-gray-200 rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>

            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i}>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="h-6 w-16 bg-gray-200 rounded-full" />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="h-5 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-10 w-40 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        <aside className="bg-white rounded-2xl shadow p-6 h-fit">
          <div className="h-24 bg-gray-200 rounded-xl my-6" />
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-12 bg-gray-200 rounded-lg" />
        </aside>
      </div>
    </div>
  );
}
