import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../services/apiService'; // Your axios instance

function CustomerMenuPage() {
  const { qrCodeIdentifier } = useParams();
  const navigate = useNavigate();

  const [tableInfo, setTableInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dishesByCategoryId, setDishesByCategoryId] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchInitialData = useCallback(async (identifier) => {
    setIsLoading(true);
    setError(null);
    try {
      const [tableResponse, categoriesResponse, dishesResponse] = await Promise.all([
        apiClient.get(`/tables/qr/${identifier}`),
        apiClient.get('/menu/categories'),
        apiClient.get('/menu/dishes?availableOnly=true')
      ]);

      setTableInfo(tableResponse.data);
      
      const categoriesData = Array.isArray(categoriesResponse.data) 
        ? categoriesResponse.data 
        : categoriesResponse.data?.content || [];
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id);
      }
      
      const dishesData = Array.isArray(dishesResponse.data)
        ? dishesResponse.data
        : dishesResponse.data?.content || [];
      const groupedDishes = dishesData.reduce((acc, dish) => {
        const categoryId = dish.category?.id || dish.categoryId;
        if (categoryId) {
            if (!acc[categoryId]) {
            acc[categoryId] = [];
            }
            acc[categoryId].push(dish);
        }
        return acc;
      }, {});
      
      setDishesByCategoryId(groupedDishes);
    } catch (err) {
      const errorMessage = err.response?.status === 404 && err.config.url.includes('/tables/qr/')
        ? 'Invalid QR code. Please scan a valid table QR code.'
        : err.response?.data?.message || err.message || 'Failed to load menu data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (qrCodeIdentifier) {
      fetchInitialData(qrCodeIdentifier);
    }
  }, [qrCodeIdentifier, fetchInitialData]);

  const handleAddToCart = useCallback((dish) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.dishId === dish.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.dishId === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, {
        dishId: dish.id,
        dishName: dish.name,
        price: dish.price,
        quantity: 1
      }];
    });
    toast.success(`${dish.name} added to cart!`);
  }, []);

  const handleIncrementQuantity = useCallback((dishId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.dishId === dishId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  const handleDecrementQuantity = useCallback((dishId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.dishId === dishId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      );
      return updatedItems.filter(item => item.quantity > 0);
    });
  }, []);

  const handleRemoveItem = useCallback((dishId) => {
    setCartItems(prevItems => prevItems.filter(item => item.dishId !== dishId));
  }, []);

  const cartTotal = useMemo(() => 
    cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    [cartItems]
  );

  const handleProceedToPayment = async () => {
    if (cartItems.length === 0) {
      toast.warn('Your cart is empty. Please add items before proceeding to payment.');
      return;
    }
    if (!tableInfo?.id) {
      toast.error('Table information is missing. Cannot proceed with payment.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    let internalOrderId = null;

    try {
      const internalOrderPayload = {
        tableId: tableInfo.id,
        notes: "", 
        items: cartItems.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity
        }))
      };

      toast.info("Finalizing your order...");
      const internalOrderResponse = await apiClient.post('/orders', internalOrderPayload);
      internalOrderId = internalOrderResponse.data.id;
      const orderTotalPriceFromBackend = internalOrderResponse.data.totalPrice;

      if (!internalOrderId || orderTotalPriceFromBackend == null) {
        throw new Error("Failed to create order reference or get total price from backend.");
      }
      console.log(`[CustomerMenuPage] Internal order created: ID=${internalOrderId}, Total=${orderTotalPriceFromBackend}`);

      const createRazorpayOrderRequest = {
        amount: orderTotalPriceFromBackend,
        currency: "INR",
        receipt: internalOrderId.toString()
      };

      const razorpayOrderResponse = await apiClient.post('/payments/create-razorpay-order', createRazorpayOrderRequest);
      const rzpOrderData = razorpayOrderResponse.data;
      console.log("[CustomerMenuPage] Razorpay order created:", rzpOrderData);

      const options = {
        key: rzpOrderData.razorpayKeyId,
        amount: rzpOrderData.amountInPaise.toString(),
        currency: rzpOrderData.currency,
        name: "Your Restaurant Name",
        description: `Order #${internalOrderId}`,
        image: "/your-logo.png",
        order_id: rzpOrderData.razorpayOrderId,
        handler: async function (response) {
          console.log("[CustomerMenuPage] Razorpay payment successful on client:", response);
          toast.info("Payment received! Verifying and confirming your order...");

          try {
            const verificationPayload = {
              internalOrderId: internalOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            
            const verifyResponse = await apiClient.post('/payments/verify-payment', verificationPayload);

            if (verifyResponse.data && verifyResponse.data.success) {
                const backendVerificationData = verifyResponse.data;

                console.log("[CustomerMenuPage] Backend payment verification successful:", backendVerificationData);
                
                setCartItems([]); // Clear the cart

                // --- THE TIMEOUT FIX ---
                // We wrap the navigation in a setTimeout with a delay of 0.
                // This pushes its execution to the end of the browser's event loop,
                // allowing other state updates in App.jsx to finish first, thus avoiding a race condition.
                setTimeout(() => {
                  console.log("Executing navigate to /order-success inside setTimeout");
                  navigate('/order-success', {
                      replace: true, 
                      state: {
                          orderDetails: {
                              internalOrderId: backendVerificationData.internalOrderId,
                              publicTrackingId: backendVerificationData.publicTrackingId,
                              newStatus: backendVerificationData.newStatus,
                              qrCodeIdentifier
                          }
                      }
                  });
                }, 0); // A delay of 0 milliseconds is all we need.

            } else {
                const errMsg = verifyResponse.data?.message || "Payment verification failed on our server. Please contact support if payment was deducted.";
                console.error("[CustomerMenuPage] Backend payment verification failed:", errMsg, verifyResponse.data);
                setPaymentError(errMsg);
                toast.error(errMsg);
                setIsProcessingPayment(false);
            }
          } catch (verifyError) {
            console.error("[CustomerMenuPage] Error calling backend for payment verification:", verifyError);
            const verifyErrMsg = verifyError.response?.data?.message || 
                                 "Could not verify payment. Please contact support. Payment ID: " + response.razorpay_payment_id;
            setPaymentError(verifyErrMsg);
            toast.error(verifyErrMsg);
            setIsProcessingPayment(false);
          }
        },
        prefill: {},
        notes: {
          internal_order_id: internalOrderId.toString(),
          table_number: tableInfo.tableNumber
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: function() {
            console.log("[CustomerMenuPage] Razorpay checkout modal dismissed by user.");
            if (isProcessingPayment) { 
                toast.warn("Payment was not completed.");
                setIsProcessingPayment(false); 
            }
          }
        }
      };

      if (!window.Razorpay) {
        toast.error("Razorpay Checkout could not be loaded. Please refresh.");
        setIsProcessingPayment(false);
        return;
      }

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', async function (response) {
        console.error("[CustomerMenuPage] Razorpay payment.failed event:", response.error);
        const rzpErrorMsg = `Payment Failed: ${response.error.description || 'Unknown Error'} (Reason: ${response.error.reason || 'N/A'})`;
        setPaymentError(rzpErrorMsg);
        toast.error(rzpErrorMsg);
        if(internalOrderId) {
            try {
                 await apiClient.put(`/orders/${internalOrderId}/status`, { status: 'PAYMENT_FAILED', cancellationReason: `Razorpay: ${response.error.reason || 'Payment Failed'}` });
            } catch (statusUpdateError) {
                console.error("Error updating order status to PAYMENT_FAILED:", statusUpdateError);
            }
        }
        setIsProcessingPayment(false);
      });

      rzp1.open();

    } catch (err) {
      console.error('Error initiating payment process:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate payment. Please try again.';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
      setIsProcessingPayment(false);
    }
  };

  // JSX for rendering the page follows...
  if (isLoading && !tableInfo) return (
    <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading table and menu information...</p>
    </div>
  );

  if (error && !tableInfo) return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold text-red-700 mb-3">Error Loading Page</h2>
            <p className="text-red-600">{error}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {tableInfo && (
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Table {tableInfo.tableNumber}
              </h1>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && tableInfo && (
             <div className="mb-8 p-4 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
            </div>
        )}

        {tableInfo && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 sm:space-x-4 pb-2 border-b">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-2 sm:px-4 rounded-t-md text-sm font-medium whitespace-nowrap focus:outline-none ${
                        selectedCategory === category.id
                          ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading && categories.length === 0 && dishesByCategoryId.length === 0 && <p>Loading dishes...</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(dishesByCategoryId[selectedCategory] || Object.values(dishesByCategoryId).flat())?.map(dish => (
                  <div key={dish.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col hover:shadow-xl transition-shadow">
                    {dish.imageUrl ? (
                      <img src={dish.imageUrl} alt={dish.name || 'Dish'} className="w-full h-40 object-cover rounded-md mb-4"/>
                    ) : (
                      <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md mb-4 text-gray-400">No Image</div>
                    )}
                    <div className="flex-1 flex flex-col">
                        <h4 className="text-lg font-semibold text-gray-800">{dish.name}</h4>
                        {dish.description && <p className="mt-1 text-sm text-gray-600 flex-grow">{dish.description}</p>}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xl font-bold text-indigo-600">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(dish.price)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(dish)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
                 {(!selectedCategory && Object.keys(dishesByCategoryId).length === 0 && !isLoading) || 
                  (selectedCategory && (!dishesByCategoryId[selectedCategory] || dishesByCategoryId[selectedCategory].length === 0) && !isLoading) ?
                  <p className="col-span-full text-center py-4 text-gray-500">No dishes available at the moment.</p> : null}
              </div>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white p-6 rounded-lg shadow-xl sticky top-24">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Your Order</h2>
                {!cartItems || cartItems.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="mt-2 text-sm text-gray-500">Your cart is empty. Add some items!</p>
                    </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
                      {cartItems.map(item => (
                        <div key={item.dishId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1 mr-2">
                            <h4 className="text-sm font-medium text-gray-700 truncate">{item.dishName}</h4>
                            <p className="text-xs text-gray-500">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleDecrementQuantity(item.dishId)} className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">-</button>
                            <span className="text-sm font-medium text-gray-800 w-5 text-center">{item.quantity}</span>
                            <button onClick={() => handleIncrementQuantity(item.dishId)} className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">+</button>
                          </div>
                          <div className="ml-2 w-20 text-right text-sm font-medium text-gray-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                          </div>
                          <button onClick={() => handleRemoveItem(item.dishId)} className="ml-2 p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-indigo-700">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cartTotal)}
                        </span>
                      </div>
                      <button
                        onClick={handleProceedToPayment}
                        disabled={isProcessingPayment || cartItems.length === 0}
                        className="w-full px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessingPayment ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Proceed to Payment'
                        )}
                      </button>
                      {paymentError && (
                        <p className="mt-3 text-sm text-center text-red-600">{paymentError}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerMenuPage;