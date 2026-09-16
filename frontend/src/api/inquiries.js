// Thin wrapper functions around the shared Axios instance (see ./api.js)
// for everything to do with Inquiries (a tenant asking a renter about a
// listing). Screens call these instead of calling API.get/post directly, so
// the actual endpoint URLs only live in one place.
import API from "./api";

// Tenant sends a new inquiry for a property. `payload` typically has
// { property, message }; the backend fills in the tenant from the JWT.
export async function createInquiry(payload) {
  const res = await API.post("/inquiries", payload);
  return res.data;
}

// Tenant's own dashboard: all inquiries THEY have sent.
export async function fetchMyInquiries() {
  const res = await API.get("/inquiries/my");
  return res.data;
}

// Renter's inbox: all inquiries sent to properties THEY own.
export async function fetchOwnerInquiries() {
  const res = await API.get("/inquiries");
  return res.data;
}

// Renter (or the tenant, to self-close) updates an inquiry's status, e.g.
// "new" -> "contacted" -> "closed".
export async function updateInquiryStatus(id, status) {
  const res = await API.put(`/inquiries/${id}/status`, { status });
  return res.data;
}