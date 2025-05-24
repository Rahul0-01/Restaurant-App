import React from 'react';

function OrderDetailsModal({ isOpen, onClose, order, isLoading }) {
  if (!isOpen) return null;

  const formatPrice = (price) => {
    if (price == null || isNaN(parseFloat(price))) return 'N/A'; // Added NaN check
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(price)); // Ensure price is a number
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {isLoading || !order ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          ) : (
            <>
              <section aria-labelledby="order-info-heading">
                <h3 id="order-info-heading" className="sr-only">Order Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order ID</p>
                    <p className="mt-1 text-gray-900 font-semibold">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Table Number</p>
                    <p className="mt-1 text-gray-900">{order.tableNumber || order.table?.tableNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1 text-gray-900">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Time</p>
                    <p className="mt-1 text-gray-900">{formatDate(order.orderTime)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Total Price</p>
                    <p className="mt-1 text-lg font-semibold text-indigo-600">{formatPrice(order.totalPrice)}</p>
                  </div>
                </div>
              </section>

              {order.notes && (
                <section aria-labelledby="order-notes-heading">
                  <h3 id="order-notes-heading" className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md whitespace-pre-wrap">{order.notes}</p>
                </section>
              )}

              <section aria-labelledby="order-items-heading">
                <h3 id="order-items-heading" className="text-lg font-medium text-gray-900 mb-3">Order Items ({order.items?.length || 0})</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dish Name</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Line Total</th>
                      </tr>
                    </thead>
                    {/* Ensure NO WHITESPACE directly inside tbody before or after the conditional rendering */}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(order.items && order.items.length > 0) ? (
                        order.items.map((item) => (
                          // Ensure NO WHITESPACE directly inside tr before or after td
                          <tr key={item.id}> {/* Assuming item.id from OrderItemResponseDTO is unique and present */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.dishName || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatPrice(item.price)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatPrice(item.lineItemTotal)}</td>
                          </tr>
                        ))
                      ) : (
                        // This row is specifically for the "no items" message
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                            No items in this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-indigo-700 hover:shadow-lg focus:bg-indigo-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-indigo-800 active:shadow-lg transition duration-150 ease-in-out"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;