// src/App.jsx
//
// This is the "route table" for the whole frontend: it decides which screen
// component renders for each URL path, using React Router. Header/Footer sit
// outside the <Routes> so they appear on every page, and <main> is where the
// matched screen actually renders.
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

// Shown briefly while a lazy-loaded screen's JS chunk is still downloading
// (see the lazy() calls above). Suspense below "catches" that loading state
// and renders this instead of a blank page.
function RouteFallback() {
  return (
    <div className="flex justify-center items-center h-[70vh] text-fg-secondary">
      Loading...
    </div>
  );
}

export default function App(){
  return (
    // BrowserRouter turns on client-side routing: clicking a <Link> or
    // navigating changes the URL and swaps which screen is shown WITHOUT a
    // full page reload/new request to the server.
    <BrowserRouter>
      {/* Accessibility feature: invisible until it receives keyboard focus
          (Tab key), at which point it lets a keyboard/screen-reader user
          jump straight to the main content instead of tabbing through the
          whole header/nav every single page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-surface focus:text-fg focus:px-4 focus:py-2 focus:rounded-sm focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content">
        {/* Suspense shows `fallback` while any lazy() component inside it is
            still being downloaded/loaded for the first time. */}
        <Suspense fallback={<RouteFallback />}>
          {/* Routes picks the ONE <Route> below whose `path` matches the
              current URL and renders its `element`. Order mostly doesn't
              matter here since paths are distinct, except the last one. */}
          <Routes>
            {/* Public pages - anyone can visit these, logged in or not. */}
            <Route path="/" element={<Home/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="/find" element={<Find/>} />

            {/* Public: viewing a single listing doesn't require login, but
                the page itself conditionally shows "Edit" vs "Send Inquiry"
                based on who's logged in. */}
            <Route path="/listing/:id" element={<ListingDetail/>} />

            {/* These three are gated: ProtectedRoute checks that someone is
                logged in AND has the right role before rendering the real
                screen; otherwise it redirects away (see ProtectedRoute.jsx). */}
            <Route path="/create-listing" element={<ProtectedRoute allowedRoles={["renter"]} ><CreateListing/></ProtectedRoute>} />
            <Route path="/renter-dashboard" element={<ProtectedRoute allowedRoles={["renter"]} ><RenterDashboard/></ProtectedRoute>} />
            <Route path="/tenant-dashboard" element={<ProtectedRoute allowedRoles={["tenant"]} ><TenantDashboard/></ProtectedRoute>} />

            {/* Catch-all: matches any URL that didn't match a route above
                (path="*"), so unknown/mistyped URLs show a 404 page instead
                of a blank screen. Must stay LAST so it doesn't shadow the
                real routes. */}
            <Route path="*" element={<NotFound/>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
