// src/App.jsx - NEW AND IMPROVED VERSION
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import RegisterPage from './components/RegisterPage';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import CustomerMenuPage from './components/CustomerMenuPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import OrderStatusPage from './components/OrderStatusPage';
import OrderManagementPage from './components/OrderManagementPage';
import AdminDashboardPlaceholder from './components/AdminDashboardPlaceholder';
import AdminManageCategories from './components/AdminManageCategories';
import AdminManageDishes from './components/AdminManageDishes';
import AdminManageTables from './components/AdminManageTables';

import { useAuth } from './context/AuthContext';
import './App.css';

// This component's only job is to protect routes.
// If the user is authenticated, it shows the page (via <Outlet />).
// If not, it redirects them to the login page.
const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const { loadingAuth } = useAuth(); // Assuming you have loadingAuth from your context

  // Show a loading screen while the AuthContext determines the initial auth state.
  // This prevents screen flicker or premature redirects.
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-700">Loading Application...</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} theme="light" />
      <Routes>
        {/* === PUBLIC ROUTES === */}
        {/* These routes are always accessible to everyone, logged in or not. */}
        <Route path="/menu/:qrCodeIdentifier" element={<CustomerMenuPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/order-status/:publicTrackingId" element={<OrderStatusPage />} />

        {/* --- Public-Only Routes (like Login/Register) --- */}
        {/* We will handle the "redirect if already logged in" inside the Login component itself,
            which is a more stable pattern. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* === PROTECTED ROUTES === */}
        {/* All routes nested under this element will be protected. */}
        <Route element={<ProtectedRoutes />}>
          {/* The AdminLayout provides the sidebar and overall structure for authenticated users. */}
          <Route element={<AdminLayout />}>
            {/* Staff & Admin Routes */}
            <Route path="/orders" element={<OrderManagementPage />} />

            {/* Admin-Only Routes (further protected by AdminRoute component) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPlaceholder />} />
              <Route path="/admin/categories" element={<AdminManageCategories />} />
              <Route path="/admin/dishes" element={<AdminManageDishes />} />
              <Route path="/admin/tables" element={<AdminManageTables />} />
            </Route>

            {/* Default redirect for authenticated users who land on "/" */}
            {/* The logic for which dashboard to show can be inside AdminLayout or here */}
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* Catch-all for any other route - redirect to the root */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

export default App;