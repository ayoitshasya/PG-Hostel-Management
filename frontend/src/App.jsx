// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './screens/home';
import NotFound from './screens/notfound';
import Login from './screens/auth/Login';
import Find from './screens/dashboard/Find';
import Signup from './screens/auth/Signup';
import ListingDetail from './screens/listing/ListingDetail';

// Code-split: these screens are only fetched when a user actually
// navigates to them, instead of shipping in everyone's initial bundle.
// ListingDetail is deliberately NOT split like the others below: it's a
// public, directly-linkable page (shared links, search results), and
// measuring showed splitting it added a real ~300ms FCP/LCP regression
// on direct loads - the extra chunk fetch (plus the InquiryModal's own
// api/inquiries.js chunk pulled in with it) costs more than the smaller
// initial bundle saves, specifically for a page people often land on
// first rather than navigate to from within the app.
const CreateListing = lazy(() => import('./screens/listing/CreateListing'));
const RenterDashboard = lazy(() => import('./screens/dashboard/RenterDashboard'));
const TenantDashboard = lazy(() => import('./screens/dashboard/TenantDashboard'));

function RouteFallback() {
  return (
    <div className="flex justify-center items-center h-[70vh] text-gray-500">
      Loading...
    </div>
  );
}

export default function App(){
  return (
    <BrowserRouter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="/find" element={<Find/>} />

            <Route path="/listing/:id" element={<ListingDetail/>} />
            <Route path="/create-listing" element={<ProtectedRoute allowedRoles={["renter"]} ><CreateListing/></ProtectedRoute>} />
            <Route path="/renter-dashboard" element={<ProtectedRoute allowedRoles={["renter"]} ><RenterDashboard/></ProtectedRoute>} />
            <Route path="/tenant-dashboard" element={<ProtectedRoute allowedRoles={["tenant"]} ><TenantDashboard/></ProtectedRoute>} />

            <Route path="*" element={<NotFound/>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
