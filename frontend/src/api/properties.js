import API from "./api";

export async function fetchProperties(params = {}) {
  const res = await API.get("/properties", { params });
  return res.data;
}
