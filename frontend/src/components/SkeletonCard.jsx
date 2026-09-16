import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface rounded-md shadow-sm overflow-hidden">
      <div className="w-full h-44 bg-neutral-200 dark:bg-neutral-700" />
      <div className="p-3.5">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-3/4 mb-3"></div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-2/3 mb-4"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/3"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/6"></div>
        </div>
      </div>
    </div>
  );
}
