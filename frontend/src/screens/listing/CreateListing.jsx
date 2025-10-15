// src/screens/listing/CreateListing.jsx
import React, { useState } from 'react';
import API from '../../api/api';
import { useNavigate } from 'react-router-dom';

const initial = {
  title:'', description:'', propertyType:'PG', targetAudience:'co-ed',
  furnishing:'semi-furnished', petsAllowed:false, amenities:[], price:0,
  location: { address:'', googleMapsUrl:'' }, photos: []
};

export default function CreateListing(){
  const [form, setForm] = useState(initial);
  const nav = useNavigate();

  function toggleAmen(a){
    setForm(s => ({
      ...s,
      amenities: s.amenities.includes(a) ? s.amenities.filter(x=>x!==a) : [...s.amenities, a]
    }));
  }

  async function handleSubmit(e){
    e.preventDefault();
    try {
      const res = await API.post('/properties', form);
      nav(`/listing/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create listing');
    }
  }

  return (
    <div className="container-centered py-10">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">List Your Property</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full px-4 py-2 border rounded-lg" placeholder="Property title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />

          <textarea className="w-full px-4 py-3 border rounded-lg" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />

          <div className="grid grid-cols-2 gap-4">
            <input className="px-4 py-2 border rounded-lg" placeholder="Price (monthly)" type="number" value={form.price} onChange={e=>setForm({...form, price:Number(e.target.value)})} />
            <select className="px-4 py-2 border rounded-lg" value={form.furnishing} onChange={e=>setForm({...form, furnishing:e.target.value})}>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.amenities.includes('wifi')} onChange={()=>toggleAmen('wifi')} className="h-4 w-4"/>
              <span className="text-gray-700">Wifi</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.amenities.includes('parking')} onChange={()=>toggleAmen('parking')} className="h-4 w-4"/>
              <span className="text-gray-700">Parking</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.amenities.includes('meals')} onChange={()=>toggleAmen('meals')} className="h-4 w-4"/>
              <span className="text-gray-700">Meals</span>
            </label>
          </div>

          <input className="w-full px-4 py-2 border rounded-lg" placeholder="Google Maps URL" value={form.location.googleMapsUrl} onChange={e=>setForm({...form, location:{...form.location, googleMapsUrl: e.target.value}})} />

          <div className="flex items-center justify-end">
            <button className="px-4 py-2 rounded-lg bg-primary text-white">Create listing</button>
          </div>
        </form>
      </div>
    </div>
  );
}
