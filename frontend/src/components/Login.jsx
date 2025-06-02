// src/components/Login.jsx - Centered Full Screen Login

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';


// Minimalist Loading Spinner
const MinimalSpinnerIcon = (props) => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAction } = useAuth();

  // --- Define Primary Accent Color (for button, focus rings etc.) ---
  // Let's use a neutral professional color or you can set your brand's primary color.
  // Tailwind's 'sky-600' is a good, neutral blue often used in professional UIs.
  // Or keep the "emerald-500" if you liked that green/teal from the split-screen attempt.
  const accentColor = "sky-600"; // Example: sky-600, indigo-600, or your brand color
  const accentColorHover = "sky-700"; // Darker shade for hover

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
   
    try {
      const response = await apiService.post('/auth/login', { username, password });
         loginAction(response.data);
      navigate('/admin/dashboard'); 
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      if (err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'Invalid username or password.';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Input styling, very clean to match the image
  const inputBaseClasses = "block w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500";
  const inputFocusClasses = `focus:ring-2 focus:ring-${accentColor} focus:border-${accentColor}`; // Use your accent color for focus
  const errorInputClasses = "border-red-500 text-red-700 focus:ring-red-500 focus:border-red-500 placeholder-red-400";

  return (
    // Main container: full screen height, flex to center content, light background
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-md space-y-8 py-12"> {/* Max width for the content block, vertical spacing, padding */}
        {/* Top Section: Title & Subtitle */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
            Restaurant Login
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Access your restaurant management panel.
          </p>
        </div>

        {/* Form Section */}
        <div className="mt-8 bg-white shadow-xl sm:rounded-xl p-8 sm:p-10"> {/* Form container with shadow and rounding */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              {/* For clean look, labels can be sr-only if placeholders are clear */}
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className={`${inputBaseClasses} ${error && (error.toLowerCase().includes('username') || error.toLowerCase().includes('invalid')) ? errorInputClasses : inputFocusClasses}`}
                placeholder="Username"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`${inputBaseClasses} ${error && error.toLowerCase().includes('password') ? errorInputClasses : inputFocusClasses}`}
                placeholder="Password"
              />
              <p className="mt-4 text-center">
  Don't have an account?{' '}
  <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
    Register here
  </Link>
</p>
            </div>

            {error && (
              <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-${accentColor} hover:bg-${accentColorHover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${accentColor} disabled:opacity-70 disabled:cursor-not-allowed transition-colors`}
              >
                {loading && <MinimalSpinnerIcon className="mr-2" />}
                {loading ? 'Verifying...' : 'Login Securely'} 
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Copyright - Positioned at the bottom of the viewport by the parent flex layout */}
      <div className="w-full max-w-md text-center py-4">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Your Restaurant Name. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;