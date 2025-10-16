// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './screens/home';
import NotFound from './screens/notfound';
import Login from './screens/auth/Login';
import Find from './screens/dashboard/Find';
import Signup from './screens/auth/Signup';
import CreateListing from './screens/listing/CreateListing';
import ListingDetail from './screens/listing/ListingDetail';
import RenterDashboard from './screens/dashboard/RenterDashboard';
import TenantDashboard from './screens/dashboard/TenantDashboard';

export default function App(){
  return (
    <BrowserRouter>
      <Header />
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
      <Footer />
    </BrowserRouter>
  );
}
