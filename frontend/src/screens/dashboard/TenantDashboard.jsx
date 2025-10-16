import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function TenantDashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get("/inquiries/my");
        // expecting { results: [...] }
        const results = res.data?.results ?? [];
        if (mounted) setInquiries(results);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || "Failed to load your inquiries");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-6">My Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">My Listings</h2>
        <p className="text-sm text-slate-500">Manage your inquiries & saved properties</p>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-lg p-6 text-slate-600">You haven't contacted any properties yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {inquiries.map((inq) => {
            const property = inq.property || {};
            const thumbnail = property.photos?.[0];
            const price = property.price ?? property.rooms?.[0]?.price;
            return (
              <div key={inq._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div
                  className="w-full h-40 bg-gray-100 cursor-pointer"
                  onClick={() => nav(`/listing/${property._id}`)}
                >
                  {thumbnail ? (
                    <img src={thumbnail} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{property.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{property.description}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <div className="text-sm text-sky-600 font-medium">
                        {price ? `${property.currency ?? "INR"} ${price}` : "Price N/A"}
                      </div>
                      <div className="text-xs text-slate-500">{property.status}</div>
                    </div>

                    <div className="text-xs text-slate-500 text-right">
                      <div>Inquired: <span className="font-medium text-slate-700">{new Date(inq.createdAt).toLocaleDateString()}</span></div>
                      <div className="mt-1">Status: <span className="font-medium">{inq.status}</span></div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => nav(`/listing/${property._id}`)}
                      className="px-3 py-1 text-sm bg-sky-500 text-white rounded-md"
                    >
                      View
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await API.put(`/inquiries/${inq._id}/status`, { status: "closed" });
                          setInquiries((prev) => prev.map(i => i._id === inq._id ? { ...i, status: "closed" } : i));
                        } catch (err) {
                          alert(err.response?.data?.error || "Could not update inquiry");
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 rounded-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
