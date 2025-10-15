// src/screens/home.jsx
import React, { useEffect, useState } from 'react';
import API from '../api/api';
import { Link } from 'react-router-dom';

export default function Home(){
  const [listings, setListings] = useState([]);

  useEffect(()=> {
    API.get('/properties').then(r => setListings(r.data)).catch(()=>{/* ignore */});
  }, []);

  return (
    <main className="container-centered py-10">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Find Your Perfect Room</h1>
        <p className="mt-3 text-gray-600">Explore PG/Hostel listings tailored to your needs.</p>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings.map(l => (
          <Link to={`/listing/${l._id}`} key={l._id} className="block group">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition">
              <div className="h-44 bg-gray-100" aria-hidden>{/* image placeholder */}</div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary">{l.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{l.description?.slice(0,80) || '—'}</p>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                  <div>{l.price ? `$${l.price}/month` : 'Price on request'}</div>
                  <div className="text-xs px-2 py-1 bg-gray-100 rounded">{l.targetAudience || 'All'}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
