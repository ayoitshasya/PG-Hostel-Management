// This is the single source of truth for "who is logged in right now" across
// the whole frontend. Instead of every screen fetching/tracking the current
// user separately, this Provider holds that state once and any component can
// read it with useContext(AuthContext) (most screens do this via a small
// `useAuth()` helper elsewhere that just calls useContext under the hood).
import React, { useState, useEffect } from "react";
import API from "../api/api";
import { AuthContext } from "./AuthContextObject";

// AuthProvider wraps the app (see main.jsx) and supplies `value` below to
// every descendant component via React Context.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true so the app can show a loading state instead of briefly
  // flashing "logged out" UI before we've even checked localStorage.
  const [loading, setLoading] = useState(true);

  // Runs once, right after the app first mounts. Login state doesn't
  // survive a page refresh on its own (React state resets), so this
  // "rehydrates" it by reading the user we saved to localStorage the last
  // time they logged in/signed up.
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        // Malformed/corrupted localStorage value - treat as logged out
        // rather than crashing the app.
        console.error("Failed to parse user from localStorage:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Calls the backend's login endpoint, then persists BOTH the JWT (used to
  // authenticate future API calls - see api/api.js's interceptor) and the
  // user object (so we don't need a network call just to redisplay their
  // name/role after a refresh) to localStorage.
  async function login(email, password, role) {
    const res = await API.post("/auth/login", { email, password, role });
    const { token, user: u } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  // Same idea as login(), but for creating a brand-new account. The backend
  // logs the new user in immediately (returns a token), so there's no
  // separate "sign up, then log in" step.
  async function signup(payload) {
    const res = await API.post("/auth/signup", payload);
    const { token, user: u } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  // Clears the stored session. There's no server-side call here because
  // this app's JWTs aren't tracked/revoked server-side - "logging out" just
  // means the browser stops sending the token.
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  // Everything inside <AuthContext.Provider> can read these via
  // useContext(AuthContext) - no need to pass user/login/etc. down as props
  // through every layer of the component tree.
  const value = {
    user,
    setUser,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
