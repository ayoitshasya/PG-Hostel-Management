// src/components/Footer.jsx
import React from 'react';

export default function Footer(){
  return (
    <footer className="border-t bg-white mt-12">
      <div className="container-centered py-8 text-center text-sm text-gray-500">
        <div>© {new Date().getFullYear()} Roomie. All rights reserved.</div>
      </div>
    </footer>
  );
}
