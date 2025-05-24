import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';
import OrderDetailsModal from './OrderDetailsModal'; // Assuming this path is correct
import { toast } from 'react-toastify';

const pageSize = 10; // Items per page

function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' for no status filter

  // State for order details modal
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // State for cancellation modal (if you keep it, otherwise remove these)
  const [cancellationReason, setCancellationReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState(null);
  // State for pending status updates in each row's dropdown
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState({});


  // Corrected order statuses to match your backend enum exactly
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
     // console.log(`[OrderManagementPage] fetchOrderDetails - Response for order ID ${orderId}:`, JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load order details.';
      setError(errorMessage); // Set page error or a specific modal error state
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
      // Add status to queryParams only if a specific status is selected (not 'ALL')
      if (selectedStatus && selectedStatus !== 'ALL') {
        queryParams.status = selectedStatus;
      }
      // If you add filterTableId state, include it here:
      // if (filterTableId) queryParams.tableId = filterTableId;

      const response = await apiClient.get('/orders', { params: queryParams });
      
      if (response.data && response.data.content) {
        setOrders(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements); // Store total elements for display
      } else {
        // Handle non-paginated or unexpected response structure
        setOrders(response.data || []);
        setTotalPages(response.data ? Math.ceil((response.data.length || 0) / pageSize) : 0);
        setTotalElements(response.data?.length || 0);
      }
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
    // If newStatus is CANCELLED and you want the cancellation reason modal:
    if (newStatus === 'CANCELLED') {
        setOrderToCancel({ id: orderId }); // Set order to cancel to show the modal
        // Store the intended new status in pending updates so the dropdown reflects it if modal is cancelled
        setPendingStatusUpdates(prev => ({ ...prev, [orderId]: newStatus }));
        return;
    }

    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId} status updated to ${newStatus}.`);
      fetchOrders(); // Refresh the list
      setPendingStatusUpdates(prev => { // Clear pending update for this order
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update order status.';
      toast.error(errorMessage);
      // Optionally revert pendingStatusUpdates[orderId] to original order.status here
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    if (!cancellationReason.trim() && orderToCancel.status === 'CANCELLED') { // status check is a bit redundant here as we only open modal for CANCELLED
      toast.warning('Please provide a reason for cancellation.');
      return;
    }
    try {
      await apiClient.put(`/orders/${orderToCancel.id}/status`, {
        status: 'CANCELLED', // Send CANCELLED status
        cancellationReason: cancellationReason.trim() // And the reason
      });
      toast.success(`Order #${orderToCancel.id} cancelled successfully.`);
      fetchOrders();
      setOrderToCancel(null); // Close modal
      setCancellationReason(''); // Reset reason
      setPendingStatusUpdates(prev => { // Clear pending update
        const updated = { ...prev };
        delete updated[orderToCancel.id];
        return updated;
      });
    } catch (err) {
      console.error('Failed to cancel order:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel order.';
      toast.error(errorMessage);
    }
  };


  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Filter handler
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(0); // Reset to first page when status filter changes
  };

  // Effect to fetch orders when currentPage or selectedStatus changes
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedStatus]); // Add other filters like filterTableId if you implement them

  const getStatusColor = (status) => {
    // Ensure your Tailwind config purges these classes if used dynamically
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'; // Changed from purple
      case 'READY': return 'bg-teal-100 text-teal-800';     // Changed from green
      case 'PAID': return 'bg-green-100 text-green-800';   // Using green for PAID
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'; // Was DELIVERED
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };


  if (isLoading && orders.length === 0) return <p className="text-center py-10">Loading orders...</p>;
  // Show error prominently if it occurs
  if (error && orders.length === 0) return <p className="text-center py-10 text-red-600">Error: {error}</p>;


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Management</h2>
      
      {/* Status Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['ALL', ...orderStatusOptions].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()} {/* Nicer display for labels */}
            </button>
          ))}
        </div>
      </div>

      {/* Display error message if fetch failed but some orders might still be shown */}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {isLoading && orders.length > 0 && <p className="text-center py-4 text-gray-500">Refreshing orders...</p>}

      {!isLoading && orders.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No orders found {selectedStatus !== 'ALL' ? `with status: ${selectedStatus}` : ''}.</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const isTerminalStatus = order.status === 'COMPLETED' || order.status === 'CANCELLED';
                const currentSelectedNewStatus = pendingStatusUpdates[order.id] || order.status;

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => fetchOrderDetails(order.id)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        #{order.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.tableNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {order.items && order.items.map(item => item.dishName).join(', ') || 'No items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <select
                          value={currentSelectedNewStatus}
                          onChange={(e) => setPendingStatusUpdates(prev => ({
                            ...prev,
                            [order.id]: e.target.value
                          }))}
                          disabled={isTerminalStatus}
                          className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          {/* Show current status as the first non-selectable if nothing pending or different */}
                          {/* <option value={order.status} disabled hidden>{order.status}</option> */}
                          {orderStatusOptions.map(statusValue => (
                            <option key={statusValue} value={statusValue}>
                              {statusValue.charAt(0) + statusValue.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const newStatus = pendingStatusUpdates[order.id];
                            if (newStatus && newStatus !== order.status) {
                              handleUpdateOrderStatus(order.id, newStatus);
                            } else {
                              toast.info('Please select a different status to update.');
                            }
                          }}
                          disabled={isTerminalStatus || !pendingStatusUpdates[order.id] || pendingStatusUpdates[order.id] === order.status}
                          className={`px-3 py-1 rounded-md text-sm ${
                            (!isTerminalStatus && pendingStatusUpdates[order.id] && pendingStatusUpdates[order.id] !== order.status)
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 shadow-md rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            {/* Mobile Pagination Buttons */}
            <button onClick={handlePreviousPage} disabled={currentPage === 0} className="...">Previous</button>
            <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="...">Next</button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min(currentPage * pageSize + 1, totalElements)}</span>
                to <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalElements)}</span>
                of <span className="font-medium">{totalElements}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button onClick={handlePreviousPage} disabled={currentPage === 0} className="..."> {/* Prev Icon */} « </button>
                {[...Array(totalPages).keys()].map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageClick(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNumber
                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
                <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="..."> {/* Next Icon */} » </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isViewDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        order={selectedOrderForDetails}
        isLoading={isFetchingDetails}
      />

      {/* Cancellation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"> {/* Higher z-index */}
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Cancel Order #{orderToCancel.id}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-3">Please provide a reason for cancellation:</p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              >
                Confirm Cancellation
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderToCancel(null);
                  setCancellationReason('');
                  setPendingStatusUpdates(prev => { // Also clear pending update if modal is cancelled
                    const updated = { ...prev };
                    if(orderToCancel) delete updated[orderToCancel.id];
                    return updated;
                  });
                }}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderManagementPage;