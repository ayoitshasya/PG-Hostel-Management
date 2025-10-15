// src/screens/notfound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound(){
  return (
    <div style={{textAlign:'center', padding:80}}>
      <h1>404 — Not Found</h1>
      <p>The page you are looking for doesn't exist.</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
