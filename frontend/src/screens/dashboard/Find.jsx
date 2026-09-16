import React, { useEffect, useState, useRef } from "react";
import { fetchProperties } from "../../api/properties";
import ListingCard from "../../components/ListingCard";
import SkeletonCard from "../../components/SkeletonCard";
import useListingOptions from "../../hooks/useListingOptions";
import Seo from "../../components/Seo";

// Matches the backend's default page size (see propertyController.list's
// `limit = 20`) so the loading skeleton grid renders the same number of
// placeholders as the real grid it's replaced by.
const RESULTS_PAGE_SIZE = 20;

export default function Find() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  const [recommended, setRecommended] = useState([]);
  const [results, setResults] = useState([]);
  // Both fetches always run on mount (see the effect below), so start in
  // the loading state rather than false. Defaulting to false meant the
  // very first render showed the tiny "No results found" empty state,
  // which then jumped to the full-height skeleton/results grid a moment
  // later - that tiny-to-tall jump was the actual cause of this page's
  // measured layout shift, not the listing images.
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState(null);
  const { options, loading: optionsLoading } = useListingOptions();

  const debounceRef = useRef(null);

  useEffect(() => {
    loadRecommended();
    search();
  }, []);

  useEffect(() => {
    if (propertyType || city || targetAudience || minPrice || maxPrice || selectedAmenities.length > 0) {
      search();
    }
  }, [propertyType, city, targetAudience, minPrice, maxPrice, selectedAmenities]);

  function buildParams() {
    const params = { limit: RESULTS_PAGE_SIZE };
    if (query) params.query = query;
    if (propertyType) params.propertyType = propertyType;
    if (city) params.city = city;
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
      <Seo
        title="Search PGs, Hostels & Apartments"
        description="Browse and filter PG, hostel, and shared apartment listings by property type, audience, price, and amenities."
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
      <p className="text-slate-500 mb-8">Find your perfect accommodation</p>

      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("search")}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === "search"
              ? "text-primary-dark border-b-2 border-primary-dark"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Browse
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="flex gap-3 items-center mb-4">
          <label className="flex-1">
            <span className="sr-only">Search for PG or Hostel</span>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search for PG or Hostel"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-primary-dark hover:bg-primary text-white font-medium"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <label className="block">
            <span className="sr-only">Property type</span>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="">All Types</option>
              {options.propertyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="">All Cities</option>
              {options.cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Target audience</span>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="">All Audiences</option>
              {options.audiences.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Minimum price</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min Price"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="block">
            <span className="sr-only">Maximum price</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max Price"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {optionsLoading && <span className="text-sm text-slate-500">Loading filters...</span>}
          {options.amenities.map((amenity) => (
            <button
              key={amenity.value}
              type="button"
              onClick={() => toggleAmenity(amenity.value)}
              aria-pressed={selectedAmenities.includes(amenity.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedAmenities.includes(amenity.value)
                  ? "bg-primary-dark text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {amenity.label}
            </button>
          ))}
        </div>
      </form>

      {activeTab === "search" && (
        <>
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Recommended for you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingRecommended
                ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
                : recommended.length > 0
                ? recommended.map((p, idx) => (
                    <ListingCard key={p._id} property={p} priority={idx === 0} />
                  ))
                : (
                  <div className="col-span-3 text-slate-500">No recommendations found.</div>
                )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Results</h2>
            {error && <div className="mb-4 text-red-600" role="alert">{error}</div>}
            {loadingResults ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: RESULTS_PAGE_SIZE }, (_, i) => (
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