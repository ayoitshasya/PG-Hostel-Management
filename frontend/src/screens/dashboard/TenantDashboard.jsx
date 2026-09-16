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
      <div className="min-h-[70vh] bg-bg text-fg">
        <div className="max-w-6xl mx-auto p-8">
          <Seo title="My Inquiries" noindex />
          <h1 className="text-2xl font-semibold mb-6">My Inquiries</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-surface rounded-md h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-bg text-fg">
      <div className="max-w-6xl mx-auto p-8">
        <Seo title="My Inquiries" noindex />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">My Inquiries</h1>
            <p className="text-sm text-fg-secondary">
              Track your property inquiries and requests
            </p>
          </div>
        </div>

        {error && <div className="mb-4 text-red-600 dark:text-red-400" role="alert">{error}</div>}

        {inquiries.length === 0 ? (
          <div className="bg-surface rounded-md p-12 text-center">
            <p className="text-fg-secondary mb-4">
              You haven't contacted any properties yet.
            </p>
            <button
              onClick={() => nav("/find")}
              className="px-6 py-3 bg-accent text-accent-fg rounded-sm hover:bg-accent-hover transition-colors"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inquiries.map((inq) => {
              const property = inq.property || {};
              const thumbnail = property.photos?.[0];
              const price = property.price ?? property.rooms?.[0]?.price;

              return (
                <div
                  key={inq._id}
                  className="bg-surface rounded-md shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  <Link
                    to={`/listing/${property._id}`}
                    className="block w-full h-40 bg-neutral-100 dark:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                      <div className="w-full h-full flex items-center justify-center text-fg-secondary">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="p-3.5">
                    <h2 className="font-semibold text-fg line-clamp-1">
                      {property.title}
                    </h2>
                    <p className="text-sm text-fg-secondary mt-1 line-clamp-2">
                      {property.description}
                    </p>
                    <p className="text-sm text-fg-secondary mt-1 line-clamp-2">
                      {inq.message}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <div className="text-sm text-accent font-medium">
                          {price
                            ? `${property.currency ?? "INR"} ${price}`
                            : "Price N/A"}
                        </div>
                        <div className="text-xs text-fg-secondary mt-1">
                          {property.status}
                        </div>
                      </div>

                      <div className="text-xs text-fg-secondary text-right">
                        <div>
                          Sent:{" "}
                          <span className="font-medium text-fg">
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1">
                          Status:{" "}
                          <span
                            className={`font-medium ${
                              inq.status === "pending"
                                ? "text-yellow-700 dark:text-yellow-400"
                                : inq.status === "contacted"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-fg-secondary"
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
                        className="flex-1 px-3 py-2 text-sm bg-accent text-accent-fg rounded-sm hover:bg-accent-hover transition-colors"
                      >
                        View Property
                      </button>

                      {inq.status !== "closed" && (
                        <button
                          onClick={() => handleClose(inq._id)}
                          className="px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 text-fg-secondary rounded-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
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
    </div>
  );
}