// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import AdminDashboardPlaceholder from './components/AdminDashboardPlaceholder';
import AdminManageCategories from './components/AdminManageCategories';
import AdminManageDishes from './components/AdminManageDishes';
import AdminManageTables from './components/AdminManageTables';
import OrderManagementPage from './components/OrderManagementPage';
import CustomerMenuPage from './components/CustomerMenuPage';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/admin/dashboard" />} />
        <Route path="/menu/:qrCodeIdentifier" element={<CustomerMenuPage />} />

        {/* Protected Routes (Admin & Staff) */}
        <Route element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />}>
          {/* Admin-only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPlaceholder />} />
            <Route path="/admin/categories" element={<AdminManageCategories />} />
            <Route path="/admin/dishes" element={<AdminManageDishes />} />
            <Route path="/admin/tables" element={<AdminManageTables />} />
          </Route>

          {/* Staff & Admin Routes */}
          <Route path="/orders" element={<OrderManagementPage />} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;