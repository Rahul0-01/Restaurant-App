import axios from 'axios';

// --- Axios Instance Setup ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptors ---
// (Your existing request and response interceptors go here and are correct)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const publicPaths = ['/login', '/register', '/menu', '/order-success', '/order-status'];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
      if (!isPublicPath) {
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// === API SERVICE FUNCTIONS ===

// --- Customer Flow ---
export const getActiveOrderForTable = (tableId) => apiClient.get(`/orders/table/${tableId}/active`);
export const startNewTab = (orderData) => apiClient.post('/orders', orderData);
export const addItemsToOrder = (orderId, items) => apiClient.post(`/orders/${orderId}/items`, { items });
export const requestBill = (orderId) => apiClient.put(`/orders/${orderId}/request-bill`);
export const callWaiter = (tableId) => apiClient.post(`/tables/${tableId}/assistance`, { requested: true });
// --- Staff/Admin Flow ---
export const getKitchenOrders = () => apiClient.get('/orders/kitchen');
export const updateOrderItemStatus = (itemId, newStatus) => {
  // THIS IS THE CORRECTED URL
  return apiClient.put(`/orders/items/${itemId}/status`, { itemStatus: newStatus });
};

// Get all service tasks for the service portal
export const getServiceTasks = () =>
  apiClient.get('/service/tasks');

// Clear assistance request for a table
export const clearAssistanceRequest = (tableId) =>
  apiClient.delete(`/tables/${tableId}/assistance`, { requested: false });

// Mark an order as COMPLETED (offline payment)
export const completeOfflineOrder = (orderId) =>
  apiClient.put(`/orders/${orderId}/status`, { status: 'COMPLETED' });

// We keep the default export for any legacy imports, but named exports are preferred.
export default apiClient;