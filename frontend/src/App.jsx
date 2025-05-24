// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import RegisterPage from './components/RegisterPage'; // Will now import the full RegisterPage

import AdminDashboardPlaceholder from './components/AdminDashboardPlaceholder';
import AdminManageCategories from './components/AdminManageCategories';
import AdminManageDishes from './components/AdminManageDishes';
import AdminManageTables from './components/AdminManageTables';
import OrderManagementPage from './components/OrderManagementPage';
import CustomerMenuPage from './components/CustomerMenuPage';

import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { isAuthenticated, user, loadingAuth } = useAuth(); // Ensure loadingAuth is from your context
  const location = useLocation();

  // Optional: More detailed logging for debugging route decisions
  // console.log(
  //   `[App.jsx] Path: ${location.pathname}, Auth: ${isAuthenticated}, Loading: ${loadingAuth}, User:`,
  //   user ? { username: user.username, roles: user.roles } : null
  // );

  if (loadingAuth) {
    // console.log("[App.jsx] Auth status loading. Showing full page loader.");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-700">Loading Application...</div>
        {/* You can add a spinner here */}
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* --- Public Routes: Login and Register --- */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={user?.roles?.includes('ROLE_ADMIN') ? "/admin/dashboard" : "/orders"} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={user?.roles?.includes('ROLE_ADMIN') ? "/admin/dashboard" : "/orders"} replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        {/* --- Customer Menu Page (Public) --- */}
        <Route path="/menu/:qrCodeIdentifier" element={<CustomerMenuPage />} />

        {/* --- Authenticated Routes (Wrapped by AdminLayout) --- */}
        <Route
          element={ // This wrapper ensures user is authenticated before trying to render AdminLayout
            isAuthenticated ? (
              <AdminLayout /> // AdminLayout contains <Outlet /> for its children
            ) : (
              // Pass current location so user can be redirected back after login
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        >
          {/* Further protect admin-specific routes within AdminLayout */}
          <Route element={<AdminRoute />}> {/* AdminRoute checks for ROLE_ADMIN */}
            <Route path="/admin/dashboard" element={<AdminDashboardPlaceholder />} />
            <Route path="/admin/categories" element={<AdminManageCategories />} />
            <Route path="/admin/dishes" element={<AdminManageDishes />} />
            <Route path="/admin/tables" element={<AdminManageTables />} />
          </Route>

          {/* Routes accessible by any authenticated user (Staff or Admin) within AdminLayout */}
          <Route path="/orders" element={<OrderManagementPage />} />
          
          {/* Default authenticated route: if user is authenticated and hits base path e.g. '/' or '/admin' */}
          <Route path="/" element={<Navigate to={user?.roles?.includes('ROLE_ADMIN') ? "/admin/dashboard" : "/orders"} replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} /> {/* Explicit redirect for /admin */}

        </Route>

        {/* --- Fallback / Catch-all for truly unhandled paths --- */}
        {/* A dedicated 404 page component is best here */}
        <Route path="*" element={<Navigate to={isAuthenticated ? (user?.roles?.includes('ROLE_ADMIN') ? "/admin/dashboard" : "/orders") : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default App;