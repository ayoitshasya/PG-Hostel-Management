// The "Create Account" screen. Same role-picker pattern as Login.jsx, plus
// name/phone/avatar fields. On submit it POSTs a new user through
// AuthContext's signup(), then sends them home already logged in.
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContextObject";
import Seo from "../../components/Seo";

export default function RoomieSignup() {
  const { signup } = useContext(AuthContext);
  // Note the lowercase default here ("tenant") vs Login.jsx's "Tenant" -
  // this one is sent straight to the API as-is (see payload.role below,
  // which lowercases it again just to be safe), while Login's role is only
  // ever used as a label/comparison value in the UI.
  const [role, setRole] = useState("tenant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  // Tracks whether the signup request is in flight, so the submit button
  // can show a spinner-ish label and disable itself to prevent double-submit.
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    // Quick client-side check before even hitting the network - the backend
    // re-validates all of this too, this is just to fail fast with a clearer
    // message instead of waiting for a round trip.
    if (!name.trim() || !email.trim() || !password) {
      alert("Name, email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: (role || "tenant").toLowerCase(),
        // Optional fields: send `undefined` (which JSON.stringify simply
        // drops) instead of an empty string, so the backend's schema
        // defaults apply cleanly rather than storing "".
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl?.trim() || undefined,
      };

      const user = await signup(payload);
      console.log("signup success -> user:", user);

      nav("/");
    } catch (err) {
      console.error("Signup error:", err);

      // The backend can fail in a few different shapes depending on where
      // the error came from (validation vs. a thrown Error vs. Mongo) - try
      // each likely spot in order and fall back to the generic Axios error
      // message if none of them are present.
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message;

      alert(serverMessage || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-28 bg-bg">
      <Seo title="Sign Up" description="Create a free Roomie account to search PG/hostel listings or list your own property." />
      <div className="w-[760px] max-w-[92%] text-center">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14 10.5 9.5 6 8l4.5-1.5L12 2z"
                className="fill-accent-500"
              />
            </svg>
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-fg-secondary">
          Your perfect stay is just a click away
        </p>

        <section className="mt-8 flex flex-col items-center">
          {/* Same segmented Renter/Tenant toggle as Login.jsx. */}
          <div className="w-[560px] max-w-full rounded-md p-1 border border-border bg-surface">
            <div className="flex rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setRole("renter")}
                aria-pressed={role === "renter"}
                className={`flex-1 py-3 px-6 text-lg font-medium border-r border-border transition-all ${
                  role === "renter"
                    ? "text-accent-fg bg-accent"
                    : "text-fg-secondary bg-transparent"
                }`}
              >
                Renter
              </button>

              <button
                type="button"
                onClick={() => setRole("tenant")}
                aria-pressed={role === "tenant"}
                className={`flex-1 py-3 px-6 text-lg font-medium transition-all ${
                  role === "tenant"
                    ? "text-accent-fg bg-accent"
                    : "text-fg-secondary bg-transparent"
                }`}
              >
                Tenant
              </button>
            </div>
          </div>

          <form
            className="mt-6 w-[560px] max-w-full text-left space-y-5"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="sr-only" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm px-4 py-4 placeholder:text-fg-secondary text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                required
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm px-4 py-4 placeholder:text-fg-secondary text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                required
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm px-4 py-4 placeholder:text-fg-secondary text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                required
              />
            </div>

            {/* Phone and avatar are both optional, so they share a row to
                keep the form from feeling longer than it needs to. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="sr-only" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-sm px-4 py-3 placeholder:text-fg-secondary text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="avatar">Avatar URL</label>
                <input
                  id="avatar"
                  type="url"
                  placeholder="Avatar URL (optional)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-sm px-4 py-3 placeholder:text-fg-secondary text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-sm font-semibold text-accent-fg text-lg bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>

            <p className="text-center text-sm text-fg-secondary mt-3">
              Already have an account?{" "}
              <Link to="/login" className="font-medium underline text-accent">
                Login
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
