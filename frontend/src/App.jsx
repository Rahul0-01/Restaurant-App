// src/App.jsx - FINAL AND CORRECTED VERSION
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- All Your Component Imports ---
import Login from './components/Login';
import RegisterPage from './components/RegisterPage';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import CustomerMenuPage from './components/CustomerMenuPage';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import OrderStatusPage from './components/OrderStatusPage';
import OrderManagementPage from './components/OrderManagementPage';
import AdminDashboard from './components/AdminDashboard';
import AdminManageCategories from './components/AdminManageCategories';
import AdminManageDishes from './components/AdminManageDishes';
import AdminManageTables from './components/AdminManageTables';
import FinalBillPage from './components/FinalBillPage';
import ServicePortalPage from './components/ServicePortalPage';
import NotFoundPage from './components/NotFoundPage';

import { useAuth } from './context/AuthContext';
import './App.css';


// --- Helper Wrapper Component for Protected Routes ---
const ProtectedRouteWrapper = () => {
    const { isAuthenticated } = useAuth();
    // If the user is authenticated, AdminLayout is rendered, which contains an <Outlet />
    // for the child routes to be displayed in.
    // If not, they are redirected to login.
    return isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />;
};

function App() {
  const { loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading Application...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} theme="light" />
      <Routes>
        {/* === PUBLIC ROUTES (Accessible to everyone) === */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/menu/:qrCodeIdentifier" element={<CustomerMenuPage />} />
        <Route path="/payment-successful" element={<PaymentSuccessPage />} />
        <Route path="/order-status/:publicTrackingId" element={<OrderStatusPage />} />
        <Route path="/bill/:publicTrackingId" element={<FinalBillPage />} />

        {/* === PROTECTED ROUTES (Require Authentication) === */}
        {/* All authenticated routes are nested inside this wrapper */}
        <Route element={<ProtectedRouteWrapper />}>
          <Route path="/orders" element={<OrderManagementPage />} />
          <Route path="/service" element={<ServicePortalPage />} />
          
          {/* Admin-Only Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminManageCategories /></AdminRoute>} />
          <Route path="/admin/dishes" element={<AdminRoute><AdminManageDishes /></AdminRoute>} />
          <Route path="/admin/tables" element={<AdminRoute><AdminManageTables /></AdminRoute>} />
          
          {/* Default redirect for authenticated users */}
          <Route path="/" element={<Navigate to="/orders" replace />} />
        </Route>

        {/* Catch-all for any route that doesn't exist */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;