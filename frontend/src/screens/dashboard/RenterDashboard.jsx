// A renter's "My Listings" screen - fetches every property in the system
// and keeps only the ones owned by the logged-in user. (There's no
// "properties for this owner" API endpoint yet, so filtering happens here
// on the client - see propertyController.js for the full list endpoint.)
import React, { useEffect, useState, useContext } from 'react';
import API from '../../api/api';
import { AuthContext } from '../../context/AuthContextObject';
import { Link } from 'react-router-dom';
import ListingCard from '../../components/ListingCard';
import Seo from '../../components/Seo';

export default function RenterDashboard(){
  const { user } = useContext(AuthContext);
  const [propsList, setPropsList] = useState([]);

  useEffect(()=> {
    API.get('/properties').then(r => {
      // Property.owner can come back either populated (an object with
      // _id) or as a bare id string depending on the endpoint, so both
      // shapes are checked here to reliably match "properties I own".
      const mine = r.data.results.filter(p => p.owner && (p.owner._id === user.id || p.owner === user._id));
      setPropsList(mine);
    }).catch(()=>{});
  }, [user]);

  return (
    <div className="min-h-[70vh] bg-bg text-fg">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Seo title="My Listings" noindex />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Listings</h1>
          <Link to="/create-listing" className="text-sm bg-accent text-accent-fg hover:bg-accent-hover px-3 py-2 rounded-sm transition-colors">Create listing</Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {propsList.map(p => (
            // headingLevel={2} keeps each card's title as an <h2>, correct
            // for this page since "My Listings" above it is already the <h1>.
            <ListingCard key={p._id} property={p} headingLevel={2} />
          ))}
        </div>
      </div>
    </div>
  );
}
