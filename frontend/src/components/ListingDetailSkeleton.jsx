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
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface rounded-md shadow overflow-hidden">
            <div className="w-full aspect-[8/5] bg-neutral-200 dark:bg-neutral-700" />

            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-2/3" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
                  <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-full" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-full" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-2/3" />
              </div>

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i}>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/2 mb-2" />
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-3/4" />
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-24 mb-3" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-20 mb-2" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/2 mb-3" />
                <div className="h-10 w-40 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
              </div>
            </div>
          </div>

          <aside className="bg-surface rounded-md shadow p-6 h-fit">
            <div className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-md my-6" />
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/2" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-2/3" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/3" />
            </div>
            <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
          </aside>
        </div>
      </div>
    </div>
  );
}
