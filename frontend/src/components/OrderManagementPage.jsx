// src/components/OrderManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getKitchenOrders, updateOrderItemStatus } from '../services/apiService';

// We define ONLY the columns that will be displayed on this KDS screen.
const KDS_COLUMNS = [
  { status: 'NEEDS_PREPARATION', label: 'New Items' },
  { status: 'IN_PROGRESS', label: 'In Progress' }
];

function OrderManagementPage() {
  const [kitchenItems, setKitchenItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  // This function fetches the data from the backend.
  const fetchKitchenItems = useCallback(async () => {
    try {
      const res = await getKitchenOrders();
      setKitchenItems(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch kitchen orders.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial mount and set up polling.
  useEffect(() => {
    fetchKitchenItems();
    const intervalId = setInterval(fetchKitchenItems, 20000); // Poll for new orders
    return () => clearInterval(intervalId);
  }, [fetchKitchenItems]);


  // --- THIS IS THE NEW, CORRECT, INSTANTANEOUS LOGIC ---
  const handleUpdateStatus = async (itemId, currentStatus, newStatus) => {
    setUpdatingItemId(itemId);

    // --- Step 1: Optimistic UI Update (This makes it feel instant) ---
    if (newStatus === 'IN_PROGRESS') {
      // If moving to 'In Progress', we update the local state immediately.
      setKitchenItems(prevItems =>
        prevItems.map(item =>
          item.orderItemId === itemId ? { ...item, itemStatus: newStatus } : item
        )
      );
    } else if (newStatus === 'READY') {
      // If moving to 'Ready', we remove it from the local state immediately.
      setKitchenItems(prevItems =>
        prevItems.filter(item => item.orderItemId !== itemId)
      );
    }

    // --- Step 2: Call the backend to make the change permanent ---
    try {
      await updateOrderItemStatus(itemId, newStatus);
      // Use a specific, helpful toast message.
      if (newStatus === 'IN_PROGRESS') {
        toast.success('Item moved to In Progress!');
      } else if (newStatus === 'READY') {
        toast.success('Item sent to Service team for delivery!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
      // --- Step 3: Rollback on Failure ---
      // If the backend call fails, we revert the UI to its original state.
      setKitchenItems(prevItems => {
        // This is a simplified rollback. A more robust solution might refetch.
        // For now, we find the item and set its status back. This is complex,
        // so a simpler approach is just to refetch the true state from the server.
        fetchKitchenItems();
        return prevItems; // Return old state while refetching
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (isLoading) {
    return <p className="text-center py-10 text-lg animate-pulse">Loading Kitchen Orders...</p>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Kitchen Display System</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      {/* This now correctly maps over only the TWO columns we defined */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {KDS_COLUMNS.map(col => (
          <div key={col.status} className="bg-gray-50 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-center border-b pb-2 p-4 bg-white rounded-t-lg">{col.label}</h3>
            <div className="p-4 space-y-4 min-h-[400px]">
              {kitchenItems.filter(item => item.itemStatus === col.status).length === 0 ? (
                <p className="text-gray-400 text-center mt-8">No items</p>
              ) : (
                kitchenItems
                  .filter(item => item.itemStatus === col.status)
                  .map(item => (
                    <div key={item.orderItemId} className="bg-white rounded-md p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-700">Table {item.tableNumber}</span>
                        <span className="text-sm text-gray-500">Order #{item.orderId}</span>
                      </div>
                      <div className="flex justify-between items-center my-1">
                        <span className="font-medium text-gray-800 text-lg">{item.dishName}</span>
                        <span className="text-gray-600 font-semibold">x{item.quantity}</span>
                      </div>
                      <div className="flex mt-2">
                        {/* The buttons are now generated dynamically based on the column */}
                        {item.itemStatus === 'NEEDS_PREPARATION' && (
                          <button 
                            onClick={() => handleUpdateStatus(item.orderItemId, item.itemStatus, 'IN_PROGRESS')} 
                            disabled={updatingItemId === item.orderItemId}
                            className="w-full px-3 py-1 text-white rounded transition-colors text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updatingItemId === item.orderItemId ? 'Moving...' : 'Start Preparing'}
                          </button>
                        )}
                        {item.itemStatus === 'IN_PROGRESS' && (
                          <button 
                            onClick={() => handleUpdateStatus(item.orderItemId, item.itemStatus, 'READY')} 
                            disabled={updatingItemId === item.orderItemId}
                            className="w-full px-3 py-1 text-white rounded transition-colors text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            {updatingItemId === item.orderItemId ? 'Finishing...' : 'Mark as Ready'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderManagementPage;