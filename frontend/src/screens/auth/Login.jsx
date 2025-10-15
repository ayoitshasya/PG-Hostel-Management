// src/screens/auth/Login.jsx
import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function Login(){
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-primary/30"
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-primary/30"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />

          <button className="w-full py-2 rounded-lg bg-primary text-white font-medium">Login</button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
