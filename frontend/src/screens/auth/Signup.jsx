// src/screens/auth/Signup.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function Signup(){
  const { signup } = useContext(AuthContext);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'tenant' });
  const nav = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
    try {
      await signup(form);
      nav('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Signup failed');
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-2">Create account</h2>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-primary/30"
            placeholder="Full name" />

          <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-primary/30"
            placeholder="Email" />

          <input value={form.password} onChange={e=>setForm({...form, password:e.target.value})}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-primary/30"
            placeholder="Password" type="password" />

          <label className="text-sm text-gray-600">
            Role
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}
              className="ml-2 px-3 py-2 border rounded-lg">
              <option value="tenant">Tenant</option>
              <option value="renter">Renter</option>
            </select>
          </label>

          <button className="mt-2 py-2 rounded-lg bg-primary text-white">Sign up</button>
        </form>
      </div>
    </div>
  );
}
