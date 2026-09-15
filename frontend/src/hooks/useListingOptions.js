import { useEffect, useState } from "react";
import { fetchListingOptions } from "../api/meta";

const EMPTY_OPTIONS = { propertyTypes: [], audiences: [], furnishing: [], statuses: [], amenities: [] };

// Shared loading state for GET /api/meta/options. The underlying request
// itself is cached (see api/meta.js), so mounting this in several
// components at once still only fires one network request.
export default function useListingOptions() {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchListingOptions()
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options: options || EMPTY_OPTIONS, loading: options === null && !error, error };
}
