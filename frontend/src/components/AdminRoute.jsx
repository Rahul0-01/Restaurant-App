import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// children prop is an alternative way to pass the component to be rendered,
// but using <Outlet /> is more conventional for layout routes in React Router v6.
// We'll assume the component to render will be passed as a child to the <Route element={<AdminRoute />}>
// and <Outlet/> will render it.
function AdminRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // To redirect back after login if desired

  // 1. Check if user is authenticated
  if (!isAuthenticated || !user) {
    // User not logged in, redirect to login page
    // Pass the current location in state so we can redirect back after login
    console.log('[AdminRoute] User not authenticated. Redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if user has the ADMIN role
  const isAdmin = user.roles && user.roles.includes('ROLE_ADMIN');
  if (!isAdmin) {
    // User is logged in but not an admin, redirect to a 'not authorized' page or dashboard
    // For now, let's redirect to the dashboard.
    // You could also create a specific "Access Denied" component/page.
    console.log('[AdminRoute] User is not ADMIN. Roles:', user.roles, 'Redirecting to dashboard.');
    return <Navigate to="/dashboard" replace />; // Or to an "/unauthorized" page
  }

  // 3. User is authenticated and is an ADMIN - render the child route's component
  // <Outlet /> will render the matched child route element.
  // This is used when AdminRoute is a parent layout route.
  // If AdminRoute is directly protecting a single component, you might pass children.
  console.log('[AdminRoute] User is ADMIN. Allowing access.');
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/admin" className="text-xl font-bold text-indigo-600">
                  Admin Panel
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/admin/categories"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Categories
                </Link>
                <Link
                  to="/admin/dishes"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dishes
                </Link>
                <Link
                  to="/admin/tables"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Tables
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminRoute;