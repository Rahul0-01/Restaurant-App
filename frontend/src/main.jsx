
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; 
import { BrowserRouter as Router } from 'react-router-dom'; 
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router> {/* Router wraps AuthProvider and App */}
      <AuthProvider> {/* AuthProvider wraps App */}
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);