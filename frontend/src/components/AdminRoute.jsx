import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// children prop is an alternative way to pass the component to be rendered,
// but using <Outlet /> is more conventional for layout routes in React Router v6.
// We'll assume the component to render will be passed as a child to the <Route element={<AdminRoute />}>
// and <Outlet/> will render it.
function AdminRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // To redirect back after login if desired

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // User not logged in, redirect to login page
    // Pass the current location in state so we can redirect back after login
    console.log('[AdminRoute] User not authenticated. Redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the ADMIN role
  const isAdmin = user.roles && user.roles.includes('ROLE_ADMIN');
  if (!isAdmin) {
    // User is logged in but not an admin, redirect to a 'not authorized' page or dashboard
    // For now, let's redirect to the dashboard.
    // You could also create a specific "Access Denied" component/page.
    console.log('[AdminRoute] User is not ADMIN. Roles:', user.roles, 'Redirecting to dashboard.');
    return <Navigate to="/orders" replace />; // Or to an "/unauthorized" page
  }

  // User is authenticated and is an ADMIN - render the child route's component
  // <Outlet /> will render the matched child route element.
  // This is used when AdminRoute is a parent layout route.
  // If AdminRoute is directly protecting a single component, you might pass children.
  console.log('[AdminRoute] User is ADMIN. Allowing access.');
  return <Outlet />;
}

export default AdminRoute;