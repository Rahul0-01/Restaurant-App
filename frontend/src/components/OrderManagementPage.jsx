import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';
import OrderDetailsModal from './OrderDetailsModal';
import { toast } from 'react-toastify';

const pageSize = 10;

function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTableId, setFilterTableId] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState({});
  const [cancellationReason, setCancellationReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState(null);
  
  // New state variables for order details modal
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const orderStatusOptions = [
    'PENDING',
    'PROCESSING',
    'READY',
    'PAID',
    'CANCELLED',
    'COMPLETED'
  ];

  const fetchOrderDetails = async (orderId) => {
    setIsFetchingDetails(true);
    setError(null);
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      setSelectedOrderForDetails(response.data);
      setIsViewDetailsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load order details.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsViewDetailsModalOpen(false);
    setSelectedOrderForDetails(null);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = {
        page: currentPage,
        size: pageSize,
      };
      if (filterStatus) queryParams.status = filterStatus;
      if (filterTableId) queryParams.tableId = filterTableId;
      const response = await apiClient.get('/orders', { params: queryParams });
      setOrders(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load orders.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === 'CANCELLED') {
        setOrderToCancel({ id: orderId, status: newStatus });
        return;
      }

      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully!');
      fetchOrders();
      setPendingStatusUpdates(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update order status.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      toast.warning('Please provide a reason for cancellation.');
      return;
    }

    try {
      await apiClient.put(`/orders/${orderToCancel.id}/status`, { 
        status: 'CANCELLED',
        cancellationReason: cancellationReason.trim()
      });
      toast.success('Order cancelled successfully!');
      fetchOrders();
      setPendingStatusUpdates(prev => {
        const updated = { ...prev };
        delete updated[orderToCancel.id];
        return updated;
      });
      setOrderToCancel(null);
      setCancellationReason('');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel order.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(0);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setFilterStatus('');
    setFilterTableId('');
    setCurrentPage(0);
    fetchOrders();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [currentPage, filterStatus, filterTableId]);

  if (isLoading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Order Management</h2>

      {/* Cancellation Modal */}
      {orderToCancel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px'
          }}>
            <h3>Cancel Order #{orderToCancel.id}</h3>
            <p>Please provide a reason for cancellation:</p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              style={{
                width: '100%',
                minHeight: '100px',
                marginBottom: '10px',
                padding: '8px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setOrderToCancel(null);
                  setCancellationReason('');
                  setPendingStatusUpdates(prev => {
                    const updated = { ...prev };
                    delete updated[orderToCancel.id];
                    return updated;
                  });
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelOrder}
                style={{ backgroundColor: '#dc2626', color: 'white' }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div>
        <div>
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tableFilter">Table ID:</label>
          <input
            type="text"
            id="tableFilter"
            value={filterTableId}
            onChange={(e) => setFilterTableId(e.target.value)}
            placeholder="Enter table ID"
          />
        </div>

        <div>
          <button onClick={handleApplyFilters}>Apply Filters</button>
          <button onClick={handleClearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table Number</th>
              <th>Status</th>
              <th>Total Price</th>
              <th>Order Date/Time</th>
              <th>Number of Items</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isCompletedOrCancelled = order.status === 'COMPLETED' || order.status === 'CANCELLED';
              const hasNewStatus = pendingStatusUpdates[order.id] && pendingStatusUpdates[order.id] !== order.status;
              
              return (
                <tr key={order.id}>
                  <td>
                    <button
                      onClick={() => fetchOrderDetails(order.id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td>{order.tableNumber || order.table?.tableNumber || 'N/A'}</td>
                  <td>{order.status}</td>
                  <td>${order.totalPrice}</td>
                  <td>{new Date(order.orderTime).toLocaleString()}</td>
                  <td>{order.items?.length || 0}</td>
                  <td>
                    <select
                      value={pendingStatusUpdates[order.id] || order.status}
                      onChange={(e) => setPendingStatusUpdates(prev => ({
                        ...prev,
                        [order.id]: e.target.value
                      }))}
                      disabled={isCompletedOrCancelled}
                    >
                      {orderStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const newStatus = pendingStatusUpdates[order.id];
                        if (newStatus && newStatus !== order.status) {
                          handleUpdateOrderStatus(order.id, newStatus);
                        } else {
                          toast.info('Please select a new status.');
                        }
                      }}
                      disabled={!hasNewStatus || isCompletedOrCancelled}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No orders found.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-4 space-x-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isViewDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        order={selectedOrderForDetails}
        isLoading={isFetchingDetails}
      />
    </div>
  );
}

export default OrderManagementPage; 