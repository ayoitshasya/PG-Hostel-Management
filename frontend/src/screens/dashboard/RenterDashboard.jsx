import React, { useEffect, useState, useContext } from 'react';
import API from '../../api/api';
import { AuthContext } from '../../context/AuthContextObject';
import { Link } from 'react-router-dom';
import ListingCard from '../../components/ListingCard';

export default function RenterDashboard(){
  const { user } = useContext(AuthContext);
  const [propsList, setPropsList] = useState([]);

  useEffect(()=> {
    API.get('/properties').then(r => {
      const mine = r.data.results.filter(p => p.owner && (p.owner._id === user.id || p.owner === user._id));
      setPropsList(mine);
    }).catch(()=>{});
  }, [user]);

  return (
    <div className="min-h-[70vh] max-w-6xl mx-auto px-6 py-10">
      <div className="container-centered py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Listings</h1>
        <Link to="/create-listing" className="text-sm bg-primary-dark text-white px-3 py-2 rounded">Create listing</Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {propsList.map(p => (
          <ListingCard key={p._id} property={p} headingLevel={2} />
        ))}
      </div>
    </div>
    </div>
  );
}
