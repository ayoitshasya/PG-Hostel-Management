// A "custom hook" in React is just a regular function (its name must start
// with `use`) that calls other hooks (useState/useEffect here) internally,
// so several components can reuse the same piece of stateful logic instead
// of copy-pasting it. This one wraps the /meta/options fetch with
// loading/error state that any screen can drop in with one line:
// `const { options, loading, error } = useListingOptions()`.
import { useEffect, useState } from "react";
import { fetchListingOptions } from "../api/meta";

// Returned while the real options haven't loaded yet (or if the fetch
// failed), so consumers can safely do `options.amenities.map(...)` without
// extra null checks.
const EMPTY_OPTIONS = { propertyTypes: [], cities: [], audiences: [], furnishing: [], statuses: [], amenities: [] };

// Shared loading state for GET /api/meta/options. The underlying request
// itself is cached (see api/meta.js), so mounting this in several
// components at once still only fires one network request.
export default function useListingOptions() {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);

  // Runs once when the component using this hook first mounts (empty
  // dependency array [] below).
  useEffect(() => {
    // Guards against calling setState after the component has already
    // unmounted (e.g. the user navigated away before the fetch finished),
    // which React would otherwise warn about.
    let cancelled = false;
    fetchListingOptions()
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    // Effect cleanup function: React calls this automatically when the
    // component unmounts, which is what actually sets `cancelled` to true.
    return () => {
      cancelled = true;
    };
  }, []);

  return { options: options || EMPTY_OPTIONS, loading: options === null && !error, error };
}
