import axios from 'axios';

// The base URL of your Spring Boot backend from environment variables,
// with a fallback for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

console.log("Axios instance created with baseURL:", API_BASE_URL);

// Create a new Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// === REQUEST INTERCEPTOR ===
// This runs BEFORE each request is sent.
// Its job is to add the JWT token to the Authorization header if it exists.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // This part handles errors that happen when setting up the request itself.
    return Promise.reject(error);
  }
);


// === RESPONSE INTERCEPTOR ===
// This runs AFTER a response is received from the backend.
// Its job is to handle global responses, especially errors.
apiClient.interceptors.response.use(
  (response) => {
    // If the response is successful (status 2xx), just return it.
    return response;
  },
  (error) => {
    // This part handles all error responses (status 4xx, 5xx).

    // --- START OF THE NEW, SMARTER 401 ERROR HANDLING ---

    // Check if the error has a response from the server and the status is 401
   // ... inside the error handling function ...
if (error.response && error.response.status === 401) {
  console.log('%c --- AXIOS 401 INTERCEPTOR FIRED --- ', 'background: red; color: white; font-size: 16px;');
  const currentPath = window.location.pathname;
  console.log(`Current window path is: ${currentPath}`);
  debugger; // <<< THIS IS THE IMPORTANT PART
  // The rest of the logic from before...
  const publicPaths = ['/login', '/register', '/menu', '/order-success', '/order-status'];
  const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
  if (!isPublicPath) {
    console.error('Redirecting to /login from protected path.');
    window.location.href = '/login';
  } else {
    console.log('On public path. NO REDIRECT will happen from interceptor.');
  }
}

    // --- END OF THE NEW, SMARTER 401 ERROR HANDLING ---
    else if (error.response) {
      // Handle other server errors (like 400, 404, 500)
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      // Handle network errors (request was made but no response received)
      console.error('API Network Error: No response received.', error.request);
    } else {
      // Handle other kinds of errors
      console.error('API Setup Error:', error.message);
    }

    // IMPORTANT: Always reject the promise so that the code that made the original
    // API call (e.g., in a component) can still use .catch() to handle the error locally.
    return Promise.reject(error);
  }
);

export default apiClient;