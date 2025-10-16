import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/api";

export default function ListingDetail() {
  const { id } = useParams();
  const [prop, setProp] = useState(null);

  useEffect(() => {
    API.get(`/properties/${id}`)
      .then((r) => setProp(r.data))
      .catch(() => {
      });
  }, [id]);

  if (!prop)
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500">
        Loading property details...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Gallery Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
          {prop.photos && prop.photos.length > 0 ? (
            <div className="h-80 w-full">
              <img
                src={prop.photos[0]}
                alt={prop.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-80 w-full bg-gray-100 flex items-center justify-center text-gray-400">
              No Image Available
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">{prop.title}</h1>
              <div className="flex gap-2 mt-2">
                {prop.propertyType && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {prop.propertyType}
                  </span>
                )}
                {prop.targetAudience && (
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium capitalize">
                    {prop.targetAudience}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-3 text-gray-600 leading-relaxed">
              {prop.description || "No description provided."}
            </p>

            {/* Price + Info Grid */}
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="text-gray-500 font-medium">Price</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {prop.price ? `₹${prop.price} / month` : "—"}
                </p>
              </div>

              <div>
                <h4 className="text-gray-500 font-medium">Furnishing</h4>
                <p className="capitalize text-gray-700">
                  {prop.furnishing || "—"}
                </p>
              </div>

              <div>
                <h4 className="text-gray-500 font-medium">Meals Provided</h4>
                <p className="capitalize text-gray-700">
                  {prop.mealsProvided ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <h4 className="text-gray-500 font-medium">Toilets</h4>
                <p className="text-gray-700">
                  {prop.toilets
                    ? `${prop.toilets.total} total, ${prop.toilets.attached} attached`
                    : "—"}
                </p>
              </div>

              <div>
                <h4 className="text-gray-500 font-medium">Pets Allowed</h4>
                <p className="capitalize text-gray-700">
                  {prop.petsAllowed ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <h4 className="text-gray-500 font-medium">Status</h4>
                <p
                  className={`capitalize font-medium ${
                    prop.status === "available"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {prop.status || "—"}
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="mt-8">
              <h4 className="text-gray-700 font-semibold mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {prop.amenities && prop.amenities.length > 0 ? (
                  prop.amenities.map((a) => (
                    <span
                      key={a}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No amenities listed</span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="mt-8">
              <h4 className="text-gray-700 font-semibold mb-2">Location</h4>
              <p className="text-gray-600 text-sm mb-3">
                {prop.location?.address || "Address not available"}
              </p>
              {prop.location?.googleMapsUrl && (
                <a
                  href={prop.location.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm transition"
                >
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contact Sidebar */}
        <aside className="bg-white rounded-2xl shadow p-6 h-fit">
          <div className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl p-4 text-center">
            <h3 className="text-lg font-semibold">Contact Host</h3>
            <p className="text-sm mt-1 opacity-90">
              Interested in this property? Send a quick inquiry!
            </p>
          </div>

          <div className="mt-6 space-y-2 text-gray-700">
            <p className="font-medium">{prop.owner?.name}</p>
            <p className="text-sm text-gray-500">{prop.owner?.email}</p>
            <p className="text-sm text-gray-500">{prop.owner?.phone}</p>
          </div>

          <button className="mt-6 w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold transition">
            Message Host
          </button>

          <div className="mt-6 text-xs text-gray-400 text-center">
            Listings verified by Roomie. Contact host directly for viewing.
          </div>
        </aside>
      </div>
    </div>
  );
}
