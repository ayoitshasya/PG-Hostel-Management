import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function RoomieLogin() {
  const { login } = useContext(AuthContext);
  const [role, setRole] = useState("Tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password, role);
      nav("/");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-28 bg-[#f5f7f8]">
      <main className="w-[760px] max-w-[92%] text-center">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14 10.5 9.5 6 8l4.5-1.5L12 2z"
                fill="#13a3e9"
                opacity="0.95"
              />
            </svg>
          </div>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold text-slate-900">Welcome to Roomie</h1>
        <p className="mt-2 text-sm text-slate-500">Your perfect stay is just a click away</p>

        <section className="mt-8 bg-transparent flex flex-col items-center">
          <div className="w-[560px] max-w-full rounded-xl p-1 border border-white shadow-inner bg-white/60 segmented">
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => setRole("Renter")}
                className={`flex-1 py-3 px-6 text-lg font-medium border-r border-white transition-all ${
                  role === "Renter" ? "text-white bg-[#13a3e9]" : "text-slate-600 bg-transparent"
                }`}
              >
                Renter
              </button>

              <button
                onClick={() => setRole("Tenant")}
                className={`flex-1 py-3 px-6 text-lg font-medium transition-all ${
                  role === "Tenant" ? "text-white bg-[#13a3e9]" : "text-slate-600 bg-transparent"
                }`}
              >
                Tenant
              </button>
            </div>
          </div>

          <form className="mt-6 w-[560px] max-w-full text-left space-y-5" onSubmit={handleSubmit}>
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
                className="w-full rounded-lg px-4 py-4 placeholder:text-slate-400 text-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200 glass-input"
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
                className="w-full rounded-lg px-4 py-4 placeholder:text-slate-400 text-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200 glass-input"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-4 rounded-lg font-semibold text-white text-lg"
                style={{
                  background: "linear-gradient(180deg,#13a3e9,#0d94d6)",
                  boxShadow: "0 8px 20px rgba(19,163,233,0.18)",
                }}
              >
                Log in
              </button>
            </div>

            <p className="text-center text-sm text-sky-600 mt-3">
              Dont have an account? <a href="#" className="font-medium underline">Sign Up</a>
            </p>
          </form>
        </section>
      </main>

      <style jsx>{`
        :root { --brand: #13a3e9; }
        .segmented { box-shadow: 0 6px 18px rgba(2,6,23,0.04); }
        .glass-input { background: rgba(255,255,255,0.85); backdrop-filter: blur(2px); }
      `}</style>
    </div>
  );
}
