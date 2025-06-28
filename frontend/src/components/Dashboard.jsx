import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuCategories from './MenuCategories';

function Dashboard() {
  // Get user, token, logoutAction, and isAuthenticated from useAuth()
  const { user, token, logoutAction, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };

  // This check is still good, App.jsx routing should also protect this route
  if (!isAuthenticated || !user) { // Also check for user object
    // console.log("[Dashboard] Not authenticated or user data missing, should redirect via App.jsx");
    return <p>Access Denied. Please log in.</p>; // Or a spinner while App.jsx redirects
  }

  // Check for ADMIN role
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');

  return (
    <div>
      <h2>Welcome to the Dashboard!</h2>
      {/* Display username if user object exists */}
      {user && <p>Logged in as: <strong>{user.username}</strong></p>}
      {user && user.roles && <p>Roles: {user.roles.join(', ')}</p>}

      {/* Conditionally show an Admin section link/button */}
      {isAdmin && (
        <div style={{ border: '1px solid blue', padding: '10px', margin: '10px 0' }}>
          <h4>Admin Section</h4>
          <p>You have admin privileges.</p>
          {/* Add links or buttons for admin actions here later */}
          {/* e.g., <button>Manage Menu</button> <button>Manage Tables</button> */}
        </div>
      )}

      <button onClick={handleLogout}>Logout</button>
      <hr />
      <MenuCategories />
    </div>
  );
}

export default Dashboard;