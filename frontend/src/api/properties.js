import API from "./api";

export async function fetchProperties(params = {}) {
  const res = await API.get("/properties", { params });
  return res.data;
}

export async function fetchPropertyById(id) {
  const res = await API.get(`/properties/${id}`);
  return res.data;
}

export async function createProperty(payload) {
  const res = await API.post("/properties", payload);
  return res.data;
}

export async function updateProperty(id, payload) {
  const res = await API.put(`/properties/${id}`, payload);
  return res.data;
}

export async function deleteProperty(id) {
  const res = await API.delete(`/properties/${id}`);
  return res.data;
}