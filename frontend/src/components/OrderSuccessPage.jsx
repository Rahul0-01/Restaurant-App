// src/components/OrderSuccessPage.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const OrderSuccessPage = () => {
  const location = useLocation();
  const orderDetails = location.state?.orderDetails;

  // Check if all essential order details are present.
  // We now also check for qrCodeIdentifier since we need it.
  const hasRequiredOrderInfo = orderDetails && 
                              orderDetails.internalOrderId && 
                              orderDetails.publicTrackingId &&
                              orderDetails.qrCodeIdentifier;

  if (!hasRequiredOrderInfo) {
    // This block executes if any orderDetails are missing.
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4 py-12">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">Order Information Missing</h2>
          <p className="text-slate-600 mb-8">
            This page should only be accessed after a successful payment. Please start a new order by scanning a table's QR code.
          </p>
          <Link
            to="/" 
            className="inline-block px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // This block executes only if all orderDetails are present.
  const { internalOrderId, publicTrackingId, newStatus, qrCodeIdentifier } = orderDetails;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 px-4 py-12">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-lg w-full">
        <CheckCircleIcon className="h-16 w-16 md:h-20 md:w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-4">Order Confirmed!</h1>
        <p className="text-slate-700 text-lg mb-3">
          Thank you! Your payment was successful and your order has been placed.
        </p>
        <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-200">
            <p className="text-slate-600 mb-1">
            Your Order ID is: <span className="font-semibold text-slate-800 text-lg block sm:inline">{internalOrderId}</span>
            </p>
            {newStatus && (
            <p className="text-slate-600">
                Current Status: <span className="font-semibold text-sky-700">{newStatus}</span>
            </p>
            )}
        </div>

        {/* This Link now correctly passes the qrCodeIdentifier in its state */}
        <Link
          to={`/order-status/${publicTrackingId}`}
          state={{ qrCodeIdentifier: qrCodeIdentifier }}
          className="w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition duration-300 text-lg mb-6 block"
        >
          Track Your Order
        </Link>

        <div className="mt-8">
          <Link
            to={qrCodeIdentifier ? `/menu/${qrCodeIdentifier}` : "/"}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Place Another Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;