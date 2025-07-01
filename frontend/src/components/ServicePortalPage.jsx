// src/components/ServicePortalPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getServiceTasks, clearAssistanceRequest, updateOrderItemStatus, completeOfflineOrder } from '../services/apiService';

function ServicePortalPage() {
  const [readyItems, setReadyItems] = useState([]);
  const [assistanceTables, setAssistanceTables] = useState([]);
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // This is the improved fetch function. It avoids flashing the main loader on polls.
  const fetchServiceTasks = useCallback(async () => {
    // We don't set isLoading to true here on subsequent calls.
    try {
      const res = await getServiceTasks();
      setReadyItems(res.data.readyItems || []);
      setAssistanceTables(res.data.assistanceTables || []);
      setPaymentOrders(res.data.paymentOrders || []);
      setError(null); // Clear previous errors on a successful fetch
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch service tasks.');
    } finally {
      // Only set the main page loader to false on the very first load.
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]); // The dependency on isLoading is important for the `finally` block logic.

  useEffect(() => {
    fetchServiceTasks(); // Initial fetch
    const interval = setInterval(fetchServiceTasks, 12000); // Poll every 12 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchServiceTasks]);

  const handleMarkDelivered = async (itemId) => {
    setProcessingId(itemId);
    try {
      await updateOrderItemStatus(itemId, 'DELIVERED');
      // Optimistic UI update: remove the item instantly from the local state.
      setReadyItems(items => items.filter(item => item.orderItemId !== itemId));
      toast.success('Item marked as delivered!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item.');
      fetchServiceTasks(); // Re-fetch to get the true state if the update failed.
    } finally {
      setProcessingId(null);
    }
  };

  // In ServicePortalPage.jsx
const handleClearAssistance = async (tableIdToClear) => {
    // First, check if the ID is valid. This prevents the "undefined" URL.
    if (!tableIdToClear) {
        toast.error("Error: Table ID is missing.");
        return;
    }

    setProcessingId(tableIdToClear);
    try {
        await clearAssistanceRequest(tableIdToClear);
        
        // Optimistic UI update: remove the table from the local list instantly.
        // THIS IS THE CORRECTED FILTER LOGIC. It uses 'id' from the table object.
        setAssistanceTables(prevTables => 
            prevTables.filter(table => table.id !== tableIdToClear)
        );

        toast.success('Assistance request cleared!');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to clear assistance request.');
        fetchServiceTasks(); // Re-fetch the true state from the server on failure.
    } finally {
        setProcessingId(null);
    }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
        <div className="text-center">
          <p className="text-lg text-slate-700 animate-pulse">Loading Service Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Service Portal</h1>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Ready for Delivery Column */}
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col min-h-[400px]">
          <h2 className="text-xl font-semibold text-green-700 mb-4 border-b pb-2 text-center">Ready for Delivery</h2>
          <div className="space-y-3 overflow-y-auto">
            {readyItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 h-full pt-16">No items ready.</div>
            ) : (
              readyItems.map(item => (
                <div key={item.orderItemId} className="p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center"><span className="font-bold text-green-900">Table {item.tableNumber}</span><span className="text-xs text-gray-500">Order #{item.orderId}</span></div>
                  <div className="flex justify-between items-center"><span className="font-medium text-gray-800">{item.dishName}</span><span className="text-gray-700">x{item.quantity}</span></div>
                  <button onClick={() => handleMarkDelivered(item.orderItemId)} disabled={processingId === item.orderItemId} className="mt-2 w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                    {processingId === item.orderItemId ? 'Updating...' : 'Mark Delivered'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistance Requests Column */}
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col min-h-[400px]">
          <h2 className="text-xl font-semibold text-yellow-700 mb-4 border-b pb-2 text-center">Assistance Requests</h2>
          <div className="space-y-3 overflow-y-auto">
            {assistanceTables.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 h-full pt-16">All clear!</div>
            ) : (
              assistanceTables.map(table => (
                <div key={table.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg flex justify-between items-center gap-2 animate-pulse">
                  <span className="font-bold text-yellow-900 text-lg">Table {table.tableNumber}</span>
                  <button onClick={() => handleClearAssistance(table.id)} disabled={processingId === table.id} className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50">
                    {processingId === table.id ? 'Clearing...' : 'Clear'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Awaiting Payment Column */}
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col min-h-[400px]">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b pb-2 text-center">Awaiting Payment</h2>
          <div className="space-y-3 overflow-y-auto">
            {paymentOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 h-full pt-16">No pending bills.</div>
            ) : (
              paymentOrders.map(order => (
                <div key={order.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center"><span className="font-bold text-blue-900">Table {order.tableNumber}</span><span className="text-xs text-gray-500">Order #{order.id}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-800">Total</span><span className="text-blue-700 font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalPrice)}</span></div>
                  <button
                    onClick={async () => {
                      setProcessingId(order.id);
                      try {
                        await completeOfflineOrder(order.id);
                        setPaymentOrders(orders => orders.filter(o => o.id !== order.id));
                        toast.success('Order marked as paid!');
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to complete payment.');
                        fetchServiceTasks();
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    disabled={processingId === order.id}
                    className="mt-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processingId === order.id ? 'Processing...' : 'Process Offline Payment'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicePortalPage;