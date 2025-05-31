// src/components/CustomerMenuPage.jsx (or your path)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../services/apiService';

function CustomerMenuPage() {
  const { qrCodeIdentifier } = useParams();
  const [tableInfo, setTableInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dishesByCategoryId, setDishesByCategoryId] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // General page/fetch errors
  const [paymentError, setPaymentError] = useState(null); // Specific errors during payment/order placement
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState(null); // { message, orderId }
  const [selectedCategory, setSelectedCategory] = useState(null); // For category filtering/tabs on menu

  const fetchInitialData = useCallback(async (identifier) => {
    setIsLoading(true);
    setError(null);
    setOrderSuccessMessage(null); // Clear previous success messages on new load
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
      if (categoriesData.length > 0 && !selectedCategory) { // Set initial selected category only if not already set
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
      // No toast here, error displayed in JSX
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]); // Removed fetchInitialData from its own dep array

  useEffect(() => {
    if (qrCodeIdentifier) {
      fetchInitialData(qrCodeIdentifier);
    }
  }, [qrCodeIdentifier, fetchInitialData]); // fetchInitialData is stable due to useCallback

  // Cart handlers (handleAddToCart, handleIncrementQuantity, etc. remain the same as your last version)
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

  // NEW: handleProceedToPayment
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
    setPaymentError(null); // Use a separate error state for payment process
    setOrderSuccessMessage(null);
    let internalOrderId = null;

    try {
      // Step 1: Create a PENDING order in your system
      const internalOrderPayload = {
        tableId: tableInfo.id,
        notes: "", // TODO: Add a notes field in UI later
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

      // Step 2: Create Razorpay Order
      const createRazorpayOrderRequest = {
        amount: orderTotalPriceFromBackend, // Use authoritative amount from your backend
        currency: "INR", // Or "INR" - TODO: make this configurable or match backend
        receipt: internalOrderId.toString()
      };

      const razorpayOrderResponse = await apiClient.post('/payments/create-razorpay-order', createRazorpayOrderRequest);
      const rzpOrderData = razorpayOrderResponse.data;
      console.log("[CustomerMenuPage] Razorpay order created:", rzpOrderData);

      // Step 3: Open Razorpay Checkout
      const options = {
        key: rzpOrderData.razorpayKeyId,
        amount: rzpOrderData.amountInPaise.toString(), // Amount in paise
        currency: "INR",
        name: "Your Restaurant Name", // Replace
        description: `Order #${internalOrderId}`,
        image: "/vite.svg", // Replace with your logo URL
        order_id: rzpOrderData.razorpayOrderId,
        handler: async function (response) {
          console.log("[CustomerMenuPage] Razorpay payment successful on client:", response);
          toast.info("Payment received! Verifying and confirming your order...");

          try {
            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId: internalOrderId // Send your internal order ID for backend to update
            };
            // This endpoint needs to be created on your backend
            await apiClient.post('/payments/verify-payment', verificationPayload);

            setOrderSuccessMessage({
                message: `Order #${internalOrderId} placed and payment confirmed! Thank you!`,
                orderId: internalOrderId
            });
            setCartItems([]);
            toast.success(`Order #${internalOrderId} confirmed!`);
            setIsProcessingPayment(false); // Reset here after full success

          } catch (verifyError) {
            console.error("Payment verification failed on backend:", verifyError);
            const verifyErrMsg = verifyError.response?.data?.message || 
                                 "Payment verification failed. Please contact support. Payment ID: " + response.razorpay_payment_id;
            setPaymentError(verifyErrMsg);
            toast.error(verifyErrMsg);
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          // name: "Customer Name", // Optional
          // email: "customer.email@example.com", // Optional
          // contact: "9876543210" // Optional
        },
        notes: {
          internal_order_id: internalOrderId.toString(),
          table_number: tableInfo.tableNumber
        },
        theme: {
          color: "#4F46E5" // Indigo color, match your theme
        },
        modal: {
          ondismiss: function() {
            console.log("[CustomerMenuPage] Razorpay checkout modal dismissed by user.");
            toast.warn("Payment was not completed.");
            setIsProcessingPayment(false);
            // Optionally: Update internal order to CANCELLED if it was PENDING and payment dismissed
            // apiClient.put(`/orders/${internalOrderId}/status`, { status: 'CANCELLED', cancellationReason: 'Payment modal dismissed' });
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
        const rzpErrorMsg = `Payment Failed: ${response.error.description} (Reason: ${response.error.reason || 'Unknown'})`;
        setPaymentError(rzpErrorMsg);
        toast.error(rzpErrorMsg);
        try { // Attempt to mark internal order as PAYMENT_FAILED or CANCELLED
            if(internalOrderId) {
                 await apiClient.put(`/orders/${internalOrderId}/status`, { status: 'CANCELLED', cancellationReason: `Razorpay: ${response.error.reason || 'Payment Failed'}` });
                 fetchInitialData(qrCodeIdentifier); // Refresh to show potential status update or just clear cart
            }
        } catch (statusUpdateError) {
            console.error("Error updating order status after payment failure:", statusUpdateError);
        }
        setIsProcessingPayment(false);
      });

      rzp1.open();
      // setIsProcessingPayment is managed by callbacks now

    } catch (err) {
      console.error('Error initiating payment process:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate payment. Please try again.';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
      setIsProcessingPayment(false);
    }
  };


  // ... (isLoading, error JSX rendering - should be fine from your previous version) ...
  // Your existing JSX for loading, error, header, menu, and cart.
  // The "Place Order" button should now call handleProceedToPayment.
  // And the error displayed near it should be paymentError.
  // Success message should use orderSuccessMessage.

  // // Simplified return for brevity - integrate this into your existing JSX structure
  // if (isLoading) return ( /* ... your loading UI ... */ );
  // if (error && !tableInfo) return ( /* ... your error UI for initial load failure ... */ ); // Prioritize initial load error if tableInfo not set

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <header className="bg-white shadow-sm sticky top-0 z-40"> {/* Added sticky header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {tableInfo && (
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Table {tableInfo.tableNumber}
              </h1>
              {/* Optionally, show cart icon/summary here */}
            </div>
          )}
          {!tableInfo && !isLoading && (
             <h1 className="text-2xl font-bold text-red-600">Invalid Table</h1>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* General Page Error (from initial load) */}
        {error && tableInfo && ( // Show error only if it's not a QR code error already handled
             <div className="mb-8 p-4 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
            </div>
        )}

        {orderSuccessMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 text-lg font-semibold">{orderSuccessMessage.message}</p>
            {orderSuccessMessage.orderId && (
              <p className="text-green-700 mt-1">Your Order ID: <strong>{orderSuccessMessage.orderId}</strong></p>
            )}
            <button 
              onClick={() => {
                setOrderSuccessMessage(null);
                // Optionally navigate or refresh menu
                // fetchInitialData(qrCodeIdentifier); // To refresh menu if needed
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Continue Browsing
            </button>
          </div>
        )}

        {/* Hide menu and cart if order was successful to show only success message */}
        {!orderSuccessMessage && tableInfo && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Menu Section (lg:col-span-2) - Your existing menu JSX */}
            <div className="lg:col-span-2">
              <div className="mb-6 overflow-x-auto"> {/* Category Tabs */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(dishesByCategoryId[selectedCategory] || Object.values(dishesByCategoryId).flat())?.map(dish => ( // Show all if no category selected
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dish.price)}
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
                 {/* Handle case where a selected category has no dishes or no category is selected and no dishes exist */}
                {(!selectedCategory && Object.keys(dishesByCategoryId).length === 0 && <p>No dishes available.</p>) || (selectedCategory && (!dishesByCategoryId[selectedCategory] || dishesByCategoryId[selectedCategory].length === 0) && <p>No dishes in this category.</p>)}

              </div>
            </div>

            {/* Cart Section (lg:col-span-1) - Your existing cart JSX */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-xl sticky top-24"> {/* Adjusted sticky top */}
                <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Your Order</h2>
                {!cartItems || cartItems.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="mt-2 text-sm text-gray-500">Your cart is empty. Add some items from the menu!</p>
                    </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2"> {/* Scrollable cart items */}
                      {cartItems.map(item => (
                        <div key={item.dishId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1 mr-2">
                            <h4 className="text-sm font-medium text-gray-700 truncate">{item.dishName}</h4>
                            <p className="text-xs text-gray-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleDecrementQuantity(item.dishId)} className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">-</button>
                            <span className="text-sm font-medium text-gray-800 w-5 text-center">{item.quantity}</span>
                            <button onClick={() => handleIncrementQuantity(item.dishId)} className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">+</button>
                          </div>
                          <div className="ml-2 w-20 text-right text-sm font-medium text-gray-800">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price * item.quantity)}
                          </div>
                          <button onClick={() => handleRemoveItem(item.dishId)} className="ml-2 p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50">
                            × {/* Remove icon */}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-indigo-700">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cartTotal)}
                        </span>
                      </div>
                      <button
                        onClick={handleProceedToPayment} // Call the new handler
                        disabled={isProcessingPayment || cartItems.length === 0}
                        className="w-full px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessingPayment ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing Payment...
                          </span>
                        ) : (
                          'Proceed to Payment'
                        )}
                      </button>
                      {paymentError && ( // Display payment-specific errors
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