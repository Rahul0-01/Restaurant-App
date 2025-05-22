import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminDashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Welcome, {user?.username}</h2>
          <p className="text-gray-600">Manage your restaurant's operations from this dashboard.</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/admin/categories" className="block text-indigo-600 hover:text-indigo-800">Manage Categories</Link>
            <Link to="/admin/dishes" className="block text-indigo-600 hover:text-indigo-800">Manage Dishes</Link>
            <Link to="/admin/tables" className="block text-indigo-600 hover:text-indigo-800">Manage Tables</Link>
            <Link to="/orders" className="block text-indigo-600 hover:text-indigo-800">View Orders</Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <p className="text-green-600">✓ System Online</p>
            <p className="text-gray-600">All services are running normally</p>
          </div>
        </div>
      </div>

      {/* Additional Content */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            Welcome to your restaurant management dashboard. Here you can:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Manage menu categories and dishes</li>
            <li>Configure restaurant tables and QR codes</li>
            <li>Monitor and manage customer orders</li>
            <li>View system status and performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPlaceholder; 