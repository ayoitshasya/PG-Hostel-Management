// src/pages/Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { fetchProperties } from "../../api/properties";
import ListingCard from "../../components/ListingCard";
import SkeletonCard from "../../components/SkeletonCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [recommended, setRecommended] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  useEffect(() => {
    loadRecommended();
    search({});
  }, []);

  function buildParams(overrides = {}) {
    const p = { ...overrides };
    if (city) p.city = city;
    if (query) p.query = query;
    return p;
  }

  async function loadRecommended() {
    setLoadingRecommended(true);
    setError(null);
    try {
      const data = await fetchProperties({ limit: 3 });
      setRecommended(Array.isArray(data.results) ? data.results.slice(0, 3) : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load recommended properties.");
    } finally {
      setLoadingRecommended(false);
    }
  }

  async function search(params = {}) {
    setLoadingResults(true);
    setError(null);
    try {
      const merged = buildParams(params);
      const data = await fetchProperties(merged);
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error(err);
      setError("Search failed. Please try again.");
    } finally {
      setLoadingResults(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    search({});
  }

  function onQueryChange(v) {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search({});
    }, 500);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome back</h2>

      {/* Search area */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 items-center">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search for PG or Hostel"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="w-56">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Mumbai)"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-3 rounded-md bg-sky-500 hover:bg-sky-600 text-white"
          >
            Search
          </button>
        </form>
      </div>

      {/* Recommended section */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-4">Recommended for you</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingRecommended
            ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
            : recommended.length
            ? recommended.map((p) => (
                <ListingCard key={p._id} property={p} onClick={() => window.alert(p.title)} />
              ))
            : (
              <div className="text-slate-500">No recommendations found.</div>
            )}
        </div>
      </section>

      {/* Results / Explore */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Results</h3>

        {error && (
          <div className="mb-4 text-red-600">{error}</div>
        )}

        {loadingResults ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((p) => (
              <ListingCard key={p._id} property={p} onClick={() => window.alert(p.title)} />
            ))}
          </div>
        ) : (
          <div className="text-slate-500">No results. Try adjusting filters or search term.</div>
        )}
      </section>
    </div>
  );
}
