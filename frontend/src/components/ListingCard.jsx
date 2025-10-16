import React from "react";
import { useNavigate } from "react-router-dom";

export default function ListingCard({ property }) {
  const nav = useNavigate();
  const thumbnail = property.photos?.[0] || "";
  const price = property.price ?? property.rooms?.[0]?.price ?? null;
  const priceLabel = price ? `${property.currency ?? "INR"} ${price}` : "Price N/A";
  const subtitle = property.description || property.propertyType || "";

  function handleClick() {
    // Navigate to detail page: /listing/:id
    nav(`/listing/${property._id}`);
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
    >
      <div className="w-full h-44 md:h-40 lg:h-44 bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-base line-clamp-2">
          {property.title}
        </h3>

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
    </div>
  );
}
