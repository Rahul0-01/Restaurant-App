// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminRoute from './components/AdminRoute'; 
import { useAuth } from './context/AuthContext';
import AdminManageCategories from './components/AdminManageCategories';
import AdminManageDishes from './components/AdminManageDishes';
import { Link } from 'react-router-dom';
import './App.css';

// Let's create a placeholder Admin Dashboard component for now
function AdminDashboardPlaceholder() {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>This is where admin-specific content and tools will go.</p>
      <nav>
        <ul>
          <li>
            <Link to="/admin/categories">Manage Categories</Link>
          </li>
          <li>
            <Link to="/admin/dishes">Manage Dishes</Link>
          </li>
          {/* Add other admin links here later */}
        </ul>
      </nav>
    </div>
  );
}
// You might later move AdminDashboardPlaceholder to its own file in src/components/ or src/pages/admin/

function App() {
  const { isAuthenticated } = useAuth(); // Still useful for general /login vs /dashboard logic
  const location = useLocation();

  // console.log(`[App.jsx] Path: ${location.pathname}, isAuthenticated: ${isAuthenticated}`);

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Authenticated User Routes (e.g., general dashboard) */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" state={{ from: location }} replace />}
        />

        {/* Admin Routes - Protected by AdminRoute */}
        {/* AdminRoute acts as a layout route here */}
        <Route element={<AdminRoute />}>
          {/* Child routes of AdminRoute. These will only be accessible if AdminRoute allows it. */}
          {/* The <Outlet /> in AdminRoute will render these. */}
          <Route path="/admin" element={<AdminDashboardPlaceholder />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPlaceholder />} />
          <Route path="/admin/categories" element={<AdminManageCategories />} />
          <Route path="/admin/dishes" element={<AdminManageDishes />} />
          {/* Example for later: <Route path="/admin/categories" element={<AdminCategoriesPage />} /> */}
          {/* Example for later: <Route path="/admin/dishes" element={<AdminDishesPage />} /> */}
        </Route>

        {/* Default route & Catch-all */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <p>The page <code>{location.pathname}</code> does not exist.</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;