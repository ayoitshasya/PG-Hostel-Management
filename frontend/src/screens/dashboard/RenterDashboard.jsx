// src/screens/dashboard/RenterDashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import API from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function RenterDashboard(){
  const { user } = useContext(AuthContext);
  const [propsList, setPropsList] = useState([]);

  useEffect(()=> {
    API.get('/properties').then(r => {
      const mine = r.data.filter(p => p.owner && (p.owner._id === user._id || p.owner === user._id));
      setPropsList(mine);
    }).catch(()=>{});
  }, [user]);

  return (
    <div className="container-centered py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Listings</h2>
        <Link to="/create-listing" className="text-sm bg-primary text-white px-3 py-2 rounded">Create listing</Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {propsList.map(p => (
          <div key={p._id} className="bg-white rounded-xl p-4 shadow">
            <div className="h-36 bg-gray-100 rounded mb-3" />
            <h3 className="font-medium text-lg">{p.title}</h3>
            <div className="text-sm text-gray-600">{p.price ? `$${p.price}/month` : 'Price TBA'}</div>
            <div className="mt-3 flex items-center justify-between">
              <Link to={`/listing/${p._id}`} className="text-primary text-sm">View</Link>
              <span className="text-xs text-gray-500">{p.status || 'Available'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
