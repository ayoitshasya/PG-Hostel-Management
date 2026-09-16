// src/api/api.js
//
// This file creates ONE shared Axios instance that every other file in
// src/api/ imports and uses to talk to the backend. Centralizing it here
// means the base URL and the auth-token logic only need to be written once.
import axios from 'axios';

// import.meta.env.VITE_API_URL comes from Vite's .env files - only vars
// prefixed VITE_ are exposed to frontend code (Vite strips everything else
// for security, since anything here ends up visible in the built JS). Falls
// back to the local backend's default address if it isn't set.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// An Axios "interceptor" is a function that runs automatically on every
// request (or response) made through this instance, before it's sent.
// Here it reads the JWT saved in localStorage at login time and stamps it
// onto the Authorization header, so every API call is automatically
// authenticated without each caller having to remember to attach it.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

export default API;
