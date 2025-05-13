import axios from 'axios';

// The base URL of your Spring Boot backend
const API_BASE_URL = 'http://localhost:8080/api'; // Adjust if your base path or port is different

// Create a new Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage (or your AuthContext if you prefer, though localStorage is common for this)
    const token = localStorage.getItem('jwtToken');

    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Return the modified config
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Add a response interceptor (optional, but good for global error handling or token refresh)
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);

      if (error.response.status === 401) {
        // Handle 401 Unauthorized errors (e.g., token expired or invalid)
        // Option 1: Simple logout
        console.warn('Unauthorized access (401). Token might be invalid or expired. Logging out.');
        localStorage.removeItem('jwtToken');
        // To trigger a full re-render and context update, you might need to call a logout function
        // from your AuthContext here, or simply redirect.
        // For simplicity now, just redirect. Ensure this doesn't cause redirect loops.
        if (window.location.pathname !== '/login') { // Avoid redirect loop if already on login
            window.location.href = '/login'; // Hard redirect to login
        }

        // Option 2: Implement token refresh logic here (more advanced)
        // This would involve an API call to a refresh token endpoint.
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error); // Important to reject the promise so calling code can catch it
  }
);

export default apiClient;