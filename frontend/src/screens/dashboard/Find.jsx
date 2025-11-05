import React, { useEffect, useState, useRef } from "react";
import { fetchProperties } from "../../api/properties";
import ListingCard from "../../components/ListingCard";
import SkeletonCard from "../../components/SkeletonCard";

export default function Find() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  const [recommended, setRecommended] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);

  useEffect(() => {
    loadRecommended();
    search();
  }, []);

  useEffect(() => {
    if (propertyType || targetAudience || minPrice || maxPrice || selectedAmenities.length > 0) {
      search();
    }
  }, [propertyType, targetAudience, minPrice, maxPrice, selectedAmenities]);

  function buildParams() {
    const params = {};
    if (query) params.query = query;
    if (propertyType) params.propertyType = propertyType;
    if (targetAudience) params.audience = targetAudience;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(",");
    return params;
  }

  async function loadRecommended() {
    setLoadingRecommended(true);
    try {
      const data = await fetchProperties({ limit: 3 });
      const results = data.results || data || [];
      setRecommended(Array.isArray(results) ? results.slice(0, 3) : []);
    } catch (err) {
      console.error("Recommended error:", err);
    } finally {
      setLoadingRecommended(false);
    }
  }

  async function search() {
    setLoadingResults(true);
    setError(null);
    try {
      const params = buildParams();
      console.log("Search params:", params);
      const data = await fetchProperties(params);
      console.log("Search response:", data);
      const results = data.results || data || [];
      setResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.response?.data?.error || "Search failed. Please try again.");
    } finally {
      setLoadingResults(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    search();
  }

  function onQueryChange(v) {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search();
    }, 500);
  }

  function toggleAmenity(amenity) {
    setSelectedAmenities((prev) => {
      const updated = prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity];
      return updated;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
      <p className="text-slate-500 mb-8">Find your perfect accommodation</p>

      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("search")}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === "search"
              ? "text-sky-500 border-b-2 border-sky-500"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Search
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="flex gap-3 items-center mb-4">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search for PG or Hostel"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">All Types</option>
            <option value="PG">PG</option>
            <option value="Apartment">Apartment</option>
            <option value="Hostel">Hostel</option>
          </select>

          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">All Audiences</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="co-ed">Co-ed</option>
          </select>

          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min Price"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />

          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["wifi", "parking", "laundry", "ac"].map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedAmenities.includes(amenity)
                  ? "bg-sky-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
      </form>

      {activeTab === "search" && (
        <>
          <section className="mb-10">
            <h3 className="text-lg font-semibold mb-4">Recommended for you</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingRecommended
                ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
                : recommended.length > 0
                ? recommended.map((p) => <ListingCard key={p._id} property={p} />)
                : (
                  <div className="col-span-3 text-slate-500">No recommendations found.</div>
                )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            {loadingResults ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : results.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((p) => (
                  <ListingCard key={p._id} property={p} />
                ))}
              </div>
            ) : (
              <div className="text-slate-500">
                No results found. Try adjusting your filters or search term.
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "saved" && (
        <div className="text-center py-12 text-slate-500">
          Saved properties feature coming soon
        </div>
      )}

      {activeTab === "requests" && (
        <div className="text-center py-12 text-slate-500">
          View your requests in the dashboard
        </div>
      )}
    </div>
  );
}