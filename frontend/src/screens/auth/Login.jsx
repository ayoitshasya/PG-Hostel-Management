// The "Log In" screen. Lets a visitor pick which role they're logging in
// as (Renter or Tenant) and enter email/password. On success it calls the
// shared AuthContext's login() (which stores the JWT) and sends them home.
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContextObject";
import Seo from "../../components/Seo";

export default function RoomieLogin() {
  // login() comes from AuthContext (see src/context/AuthContext.jsx) - it's
  // the one place that knows how to call the API and save the token/user.
  const { login } = useContext(AuthContext);
  // "Controlled inputs": the <input>'s value is driven by this state, and
  // every keystroke updates the state via onChange - React is the single
  // source of truth for what's in the box, not the DOM.
  const [role, setRole] = useState("Tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function handleSubmit(e) {
    // Stop the browser's default "reload the page and GET/POST the form"
    // behavior - we're handling the submit ourselves with an API call.
    e.preventDefault();
    try {
      await login(email, password, role);
      nav("/");
    } catch (err) {
      // Backend sends { error: "..." } on failure (see authController.js);
      // fall back to a generic message if the response shape is different.
      alert(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-28 bg-bg">
      <Seo title="Log In" description="Log in to Roomie to browse listings or manage your properties." />
      <div className="w-[760px] max-w-[92%] text-center">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center">
            {/* Decorative sparkle/star logo mark - hidden from screen readers
                since it carries no information beyond the "Welcome to Roomie"
                heading right below it. */}
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

        <h1 className="mt-6 text-4xl font-extrabold">Welcome to Roomie</h1>
        <p className="mt-2 text-sm text-fg-secondary">Your perfect stay is just a click away</p>

        <section className="mt-8 flex flex-col items-center">
          {/* Role picker - a pair of toggle buttons, not a <select>, since
              there are only two options and this reads more clearly as a
              segmented control. aria-pressed tells assistive tech which one
              is currently "on". */}
          <div className="w-[560px] max-w-full rounded-md p-1 border border-border bg-surface">
            <div className="flex rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setRole("Renter")}
                aria-pressed={role === "Renter"}
                className={`flex-1 py-3 px-6 text-lg font-medium border-r border-border transition-all ${
                  role === "Renter" ? "text-accent-fg bg-accent" : "text-fg-secondary bg-transparent"
                }`}
              >
                Renter
              </button>

              <button
                type="button"
                onClick={() => setRole("Tenant")}
                aria-pressed={role === "Tenant"}
                className={`flex-1 py-3 px-6 text-lg font-medium transition-all ${
                  role === "Tenant" ? "text-accent-fg bg-accent" : "text-fg-secondary bg-transparent"
                }`}
              >
                Tenant
              </button>
            </div>
          </div>

          <form className="mt-6 w-[560px] max-w-full text-left space-y-5" onSubmit={handleSubmit}>
            <div>
              {/* sr-only: visually hidden but still read by screen readers -
                  the placeholder text below acts as the visible label, but a
                  placeholder alone isn't an accessible label, so a real
                  (hidden) <label> is paired with the input via htmlFor/id. */}
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
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-4 rounded-sm font-semibold text-accent-fg text-lg bg-accent hover:bg-accent-hover transition-colors"
              >
                Log in
              </button>
            </div>

            <p className="text-center text-sm text-fg-secondary mt-3">
              Dont have an account? <Link to="/signup" className="font-medium underline text-accent">Sign Up</Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
