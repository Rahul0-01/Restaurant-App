import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import apiClient from '../services/apiService';

const OrderStatusPage = () => {
  const { publicTrackingId } = useParams();
  const location = useLocation();
  const qrCodeIdentifier = location.state?.qrCodeIdentifier;
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderStatus = async () => {
    try {
      const response = await apiClient.get(`/orders/status/${publicTrackingId}`);
      setOrderData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch order status:', err);
      const errorMessage = err.response?.data?.message || 'Order not found or unable to load order status.';
      setError(errorMessage);
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchOrderStatus();

    // Set up auto-refresh every 20 seconds
    const intervalId = setInterval(fetchOrderStatus, 20000);

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [publicTrackingId]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'READY':
        return 'text-green-600 bg-green-100';
      case 'PROCESSING':
        return 'text-yellow-600 bg-yellow-100';
      case 'PENDING':
        return 'text-blue-600 bg-blue-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatOrderTime = (orderTime) => {
    if (!orderTime) return 'N/A';
    return new Date(orderTime).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-700">Loading Order Status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <p className="text-sm text-slate-500 mb-4">Tracking ID: {publicTrackingId}</p>
          <a href="/" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-md shadow hover:bg-sky-700 transition-colors">
            Back to Menu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Order Status</h1>
          <p className="text-slate-600">We'll keep you updated on your order progress</p>
        </div>

        {/* Order ID */}
        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-slate-600 mb-1">Order ID</div>
          <div className="text-lg font-mono text-slate-900">{orderData.internalOrderId}</div>
        </div>

        {/* Status */}
        <div className="text-center mb-8">
          <div className="text-sm text-slate-600 mb-2">Current Status</div>
          <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${getStatusColor(orderData.status)}`}>
            {orderData.status}
          </div>
        </div>

        {/* Order Time */}
        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-slate-600 mb-1">Order Placed</div>
          <div className="text-slate-900">{formatOrderTime(orderData.orderTime)}</div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Items</h3>
          <div className="space-y-3">
            {orderData.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-900">{item.dishName}</span>
                <span className="text-slate-600">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center text-sm text-slate-500">
            <div className="animate-pulse w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
            Auto-refreshing every 20 seconds
          </div>
        </div>

        {/* Back to menu link */}
        <div className="text-center mt-6">
          <Link
            to={qrCodeIdentifier ? `/menu/${qrCodeIdentifier}` : "/"}
            className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors"
          >
            ← Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage; 