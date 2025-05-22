import React from 'react';

function OrderDetailsModal({ isOpen, onClose, order, isLoading }) {
  if (!isOpen || !order) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <p>Loading order details...</p>
        ) : (
          <div className="space-y-4">
            {/* Order Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Table Number</p>
                <p className="font-medium">
                  {order.table?.tableNumber || order.tableNumber || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Time</p>
                <p className="font-medium">
                  {new Date(order.orderTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="font-medium">{formatPrice(order.totalPrice)}</p>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-medium">{order.notes}</p>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dish Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Line Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {item.dishName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatPrice(item.lineItemTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetailsModal; 