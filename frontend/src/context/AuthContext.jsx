// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize token from localStorage
  const [token, setToken] = useState(localStorage.getItem('jwtToken'));
  // Initialize user from localStorage (we'll store user object as JSON string)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      localStorage.removeItem('user'); // Clear corrupted data
      return null;
    }
  });

  const navigate = useNavigate();
  const isAuthenticated = !!token && !!user; // Now also check if user object exists

  // Effect for initial load (sync from localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem('jwtToken');
    const storedUserString = localStorage.getItem('user');

    if (storedToken && storedUserString) {
      try {
        const storedUserObject = JSON.parse(storedUserString);
        setToken(storedToken);
        setUser(storedUserObject);
        console.log("[AuthContext] Token and user restored from localStorage on mount:", storedUserObject);
      } catch (error) {
        console.error("Failed to parse stored user on mount:", error);
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } else {
      // If either is missing, ensure a clean slate
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []); // Runs once on mount

  // loginAction now expects the whole response data from the API
  const loginAction = (loginResponseData) => {
    console.log("[AuthContext] loginAction called with data:", loginResponseData);
    if (loginResponseData && loginResponseData.jwtToken && loginResponseData.username && loginResponseData.roles) {
      const { jwtToken, username, roles } = loginResponseData;

      localStorage.setItem('jwtToken', jwtToken);
      // Store user object as a JSON string in localStorage
      const userToStore = { username, roles };
      localStorage.setItem('user', JSON.stringify(userToStore));

      setToken(jwtToken);
      setUser(userToStore); // Set the user object in state

      console.log("[AuthContext] User logged in:", userToStore);
      navigate('/dashboard');
    } else {
      console.error("[AuthContext] loginAction received incomplete data:", loginResponseData);
      // Handle error - perhaps show a message to the user or log out
      // For now, just log and don't proceed with login state update
    }
  };

  const logoutAction = () => {
    console.log("[AuthContext] logoutAction called");
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user'); // Remove user from localStorage
    setToken(null);
    setUser(null); // Clear user from state
    navigate('/login');
  };

  const value = {
    token,
    user, // Provide the user object
    isAuthenticated,
    loginAction,
    logoutAction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}