import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../services/apiService';

function FinalBillPage() {
  const { publicTrackingId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [offlineConfirmed, setOfflineConfirmed] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/orders/status/${publicTrackingId}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'This bill could not be found or has expired.');
      } finally {
        setIsLoading(false);
      }
    }
    if (publicTrackingId) fetchOrder();
  }, [publicTrackingId]);

  // Razorpay payment handler
  const handlePayOnline = async () => {
    if (!order) return;
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      // 1. Create Razorpay order on backend
      const createRazorpayOrderRequest = {
        amount: order.totalPrice,
        currency: 'INR',
        receipt: order.internalOrderId?.toString() || order.id?.toString(),
      };
      const razorpayOrderResponse = await apiClient.post('/payments/create-razorpay-order', createRazorpayOrderRequest);
      const rzpOrderData = razorpayOrderResponse.data;
      // 2. Open Razorpay modal
      const options = {
        key: rzpOrderData.razorpayKeyId,
        amount: rzpOrderData.amountInPaise.toString(),
        currency: rzpOrderData.currency,
        name: 'Your Restaurant Name',
        description: `Order #${order.internalOrderId || order.id}`,
        order_id: rzpOrderData.razorpayOrderId,
        handler: async (response) => {
          try {
            const verificationPayload = { internalOrderId: order.internalOrderId || order.id, ...response };
            const verifyResponse = await apiClient.post('/payments/verify-payment', verificationPayload);
            if (verifyResponse.data && verifyResponse.data.success) {
    
              // --- THE TIMEOUT TRICK ---
              // This is the same fix we used before to solve the race condition.
              setTimeout(() => {
                  navigate('/payment-successful', { 
                      replace: true, 
                      state: { orderDetails: verifyResponse.data } 
                  });
              }, 0); // Delay of 0 is all that's needed.
          
          }
          else {
              throw new Error(verifyResponse.data?.message || 'Payment verification failed.');
            }
          } catch (verifyError) {
            const verifyErrMsg = verifyError.response?.data?.message || 'Could not verify payment.';
            setPaymentError(verifyErrMsg);
            toast.error(verifyErrMsg);
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (isProcessingPayment) {
              toast.warn('Payment was not completed.');
              setIsProcessingPayment(false);
            }
          }
        },
        notes: { internal_order_id: (order.internalOrderId || order.id)?.toString() },
        theme: { color: '#4F46E5' }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', (response) => {
        const rzpErrorMsg = `Payment Failed: ${response.error.description || 'Unknown Error'}`;
        setPaymentError(rzpErrorMsg);
        toast.error(rzpErrorMsg);
        setIsProcessingPayment(false);
      });
      rzp1.open();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to initiate payment.';
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      setIsProcessingPayment(false);
    }
  };

  // Offline payment confirmation
  const handlePayAtCounter = () => {
    setOfflineConfirmed(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <p className="text-lg animate-pulse">Loading Your Bill...</p>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-3">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Could not find the specified order.'}</p>
          <Link to="/" className="text-indigo-600 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  // If already paid, show receipt only
  if (order.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8">
        <div className="max-w-2xl w-full px-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-slate-800">Receipt</h1>
            <p className="text-lg text-slate-500 mt-2">Order #{order.internalOrderId || order.id}</p>
          </header>
          <main className="bg-white p-6 sm:p-8 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex items-baseline justify-between">
                  <div>
                    <p className="font-medium text-slate-700">{item.dishName}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-dashed border-gray-200 mt-6 pt-6">
              <div className="flex justify-between items-center text-lg font-semibold text-slate-800 mb-6">
                <span>Total Amount</span>
                <span className="text-2xl font-bold text-indigo-700">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalPrice)}
                </span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-lg">This bill has already been paid</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Main bill & payment UI
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8">
      <div className="max-w-2xl w-full px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800">Final Bill</h1>
          <p className="text-lg text-slate-500 mt-2">Order #{order.internalOrderId || order.id}</p>
        </header>
        <main className="bg-white p-6 sm:p-8 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="flex items-baseline justify-between">
                <div>
                  <p className="font-medium text-slate-700">{item.dishName}</p>
                  <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-slate-800 font-medium">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-gray-200 mt-6 pt-6">
            <div className="flex justify-between items-center text-lg font-semibold text-slate-800 mb-6">
              <span>Total Amount</span>
              <span className="text-2xl font-bold text-indigo-700">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalPrice)}
              </span>
            </div>
            {!offlineConfirmed ? (
              <div className="space-y-3">
                <button
                  onClick={handlePayOnline}
                  disabled={isProcessingPayment}
                  className="w-full px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessingPayment ? 'Processing...' : 'Pay Online Now'}
                </button>
                <button
                  onClick={handlePayAtCounter}
                  disabled={isProcessingPayment}
                  className="w-full px-4 py-3 bg-gray-700 text-white text-base font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Pay at Counter
                </button>
                {paymentError && <p className="mt-4 text-sm text-center text-red-600">{paymentError}</p>}
              </div>
            ) : (
              <div className="mt-8 text-center">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold text-lg">Confirmation Received! Please show this screen or provide Order ID #{order.internalOrderId || order.id} at the counter to complete your payment.</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default FinalBillPage;