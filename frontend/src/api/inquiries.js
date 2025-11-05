import API from "./api";

export async function createInquiry(payload) {
  const res = await API.post("/inquiries", payload);
  return res.data;
}

export async function fetchMyInquiries() {
  const res = await API.get("/inquiries/my");
  return res.data;
}

export async function fetchOwnerInquiries() {
  const res = await API.get("/inquiries");
  return res.data;
}

export async function updateInquiryStatus(id, status) {
  const res = await API.put(`/inquiries/${id}/status`, { status });
  return res.data;
}