// Thin wrapper functions around the shared Axios instance (see ./api.js)
// for CRUD operations on Property listings, so screens never build the
// endpoint URLs themselves.
import API from "./api";

// `params` becomes the query string, e.g. { minPrice, maxPrice, amenities,
// query, page } -> /properties?minPrice=...&maxPrice=...  Used by the /find
// search/filter screen. No auth needed - listings are public.
export async function fetchProperties(params = {}) {
  const res = await API.get("/properties", { params });
  return res.data;
}

// Single listing's full details, used by the ListingDetail page.
export async function fetchPropertyById(id) {
  const res = await API.get(`/properties/${id}`);
  return res.data;
}

// Renter creates a new listing (the JWT attached by the Axios interceptor
// identifies which renter owns it - see ./api.js).
export async function createProperty(payload) {
  const res = await API.post("/properties", payload);
  return res.data;
}

// Renter edits a listing they own.
export async function updateProperty(id, payload) {
  const res = await API.put(`/properties/${id}`, payload);
  return res.data;
}

// Renter deletes a listing they own.
export async function deleteProperty(id) {
  const res = await API.delete(`/properties/${id}`);
  return res.data;
}