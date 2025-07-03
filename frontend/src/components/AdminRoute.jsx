// src/components/AdminRoute.jsx - FINAL CORRECTED VERSION
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * This is a "Wrapper Component" style route guard.
 * It checks for admin privileges.
 * @param {object} props - The props object.
 * @param {React.ReactNode} props.children - The component to render if the user is an admin.
 */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  // Check if the user object exists and if their roles array includes 'ROLE_ADMIN'.
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  if (isAdmin) {
    // If the user IS an admin, render the component that was passed in.
    // This is the key part that was missing.
    return children;
  }

  // If the user is NOT an admin, redirect them to a safe default page.
  // This prevents non-admin staff from accessing admin-only pages.
  return <Navigate to="/orders" replace />;
};

export default AdminRoute;