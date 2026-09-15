import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchMyInquiries, updateInquiryStatus } from "../../api/inquiries";
import Seo from "../../components/Seo";

export default function TenantDashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyInquiries();
      setInquiries(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(inquiryId) {
    try {
      await updateInquiryStatus(inquiryId, "closed");
      setInquiries((prev) =>
        prev.map((inq) =>
          inq._id === inquiryId ? { ...inq, status: "closed" } : inq
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update inquiry");
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <Seo title="My Inquiries" noindex />
        <h1 className="text-2xl font-semibold mb-6">My Inquiries</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Seo title="My Inquiries" noindex />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Inquiries</h1>
          <p className="text-sm text-slate-500">
            Track your property inquiries and requests
          </p>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600" role="alert">{error}</div>}

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-slate-600 mb-4">
            You haven't contacted any properties yet.
          </p>
          <button
            onClick={() => nav("/find")}
            className="px-6 py-3 bg-primary-dark text-white rounded-lg hover:bg-primary"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {inquiries.map((inq) => {
            const property = inq.property || {};
            const thumbnail = property.photos?.[0];
            const price = property.price ?? property.rooms?.[0]?.price;

            return (
              <div
                key={inq._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <Link
                  to={`/listing/${property._id}`}
                  className="block w-full h-40 bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <h2 className="font-semibold text-slate-900 line-clamp-1">
                    {property.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {property.description}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {inq.message}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <div className="text-sm text-primary-dark font-medium">
                        {price
                          ? `${property.currency ?? "INR"} ${price}`
                          : "Price N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {property.status}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 text-right">
                      <div>
                        Sent:{" "}
                        <span className="font-medium text-slate-700">
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            inq.status === "pending"
                              ? "text-yellow-700"
                              : inq.status === "contacted"
                              ? "text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => nav(`/listing/${property._id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-primary-dark text-white rounded-lg hover:bg-primary"
                    >
                      View Property
                    </button>

                    {inq.status !== "closed" && (
                      <button
                        onClick={() => handleClose(inq._id)}
                        className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                      >
                        Close
                      </button>
                    )}
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