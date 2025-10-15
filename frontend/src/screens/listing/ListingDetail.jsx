// src/screens/listing/ListingDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/api';

export default function ListingDetail(){
  const { id } = useParams();
  const [prop, setProp] = useState(null);

  useEffect(()=>{
    API.get(`/properties/${id}`).then(r=>setProp(r.data)).catch(()=>{/* ignore */});
  }, [id]);

  if(!prop) return <div className="py-20 text-center">Loading...</div>;

  return (
    <div className="container-centered py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
          <div className="h-64 bg-gray-100 rounded mb-4" aria-hidden />
          <h1 className="text-2xl font-bold">{prop.title}</h1>
          <p className="mt-3 text-gray-600">{prop.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Price</h4>
              <div className="mt-1 text-lg font-semibold">{prop.price ? `$${prop.price}/month` : '—'}</div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Amenities</h4>
              <div className="mt-1 text-sm text-gray-600">{prop.amenities?.join(', ') || 'None'}</div>
            </div>
          </div>

          <div className="mt-6">
            <a className="text-primary" href={prop.location?.googleMapsUrl || '#'} target="_blank" rel="noreferrer">View on map</a>
          </div>
        </div>

        <aside className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-lg font-medium mb-2">Contact</h3>
          <div className="text-gray-700">{prop.owner?.name}</div>
          <div className="text-sm text-gray-500">{prop.owner?.email}</div>

          <button className="mt-6 w-full py-2 rounded-lg bg-primary text-white">Message Host</button>
        </aside>
      </div>
    </div>
  );
}
