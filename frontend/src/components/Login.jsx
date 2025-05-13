import React, { useState } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // No longer need useNavigate here directly
import { useAuth } from '../context/AuthContext'; // Import useAuth

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate(); // Remove this
  const { loginAction } = useAuth(); // Get loginAction from context

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const loginUrl = 'http://localhost:8080/api/auth/login';

    try {
      const response = await axios.post(loginUrl, {
        username: username,
        password: password,
      });

      console.log('Login successful (from Login.jsx):', response.data);
      const token = response.data.jwtToken;
      // localStorage.setItem('jwtToken', token); // AuthContext handles this now
      loginAction(response.data); // << CALL loginAction from context
      // navigate('/dashboard'); // AuthContext handles this now

    } catch (err) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... form JSX remains the same ...
    <div>
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;