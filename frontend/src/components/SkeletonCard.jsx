import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="w-full h-44 bg-slate-200" />
      <div className="p-4">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 rounded w-1/6"></div>
        </div>
      </div>
    </div>
  );
}
