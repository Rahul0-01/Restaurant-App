import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../services/apiService';

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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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
      
      const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.content || [];
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id);
      }
      
      const dishesData = Array.isArray(dishesResponse.data) ? dishesResponse.data : dishesResponse.data?.content || [];
      const groupedDishes = dishesData.reduce((acc, dish) => {
        const categoryId = dish.category?.id || dish.categoryId;
        if (categoryId) {
            if (!acc[categoryId]) acc[categoryId] = [];
            acc[categoryId].push(dish);
        }
        return acc;
      }, {});
      setDishesByCategoryId(groupedDishes);
    } catch (err) {
      const errorMessage = err.response?.status === 404 ? 'Invalid QR code.' : err.response?.data?.message || 'Failed to load menu data.';
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
        return prevItems.map(item => item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevItems, { dishId: dish.id, dishName: dish.name, price: dish.price, quantity: 1 }];
    });
    toast.success(`${dish.name} added to cart!`);
  }, []);

  const handleIncrementQuantity = useCallback((dishId) => {
    setCartItems(prevItems => prevItems.map(item => item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item));
  }, []);

  const handleDecrementQuantity = useCallback((dishId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => item.dishId === dishId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item);
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

  const handlePaymentChoice = async (paymentType) => {
    if (cartItems.length === 0 || !tableInfo?.id) {
      toast.error('Cannot proceed with an empty cart or missing table info.');
      return;
    }
  
    setIsConfirmModalOpen(false);
    setIsProcessingPayment(true);
    setPaymentError(null);
    let internalOrderId = null;
  
    try {
      const internalOrderPayload = {
        tableId: tableInfo.id,
        items: cartItems.map(item => ({ dishId: item.dishId, quantity: item.quantity })),
        paymentType: paymentType
      };
  
      toast.info("Placing your order...");
      const internalOrderResponse = await apiClient.post('/orders', internalOrderPayload);
      const createdOrder = internalOrderResponse.data;
      internalOrderId = createdOrder.id;
  
      if (!internalOrderId) throw new Error("Failed to create order reference from backend.");
  
      if (paymentType === 'ONLINE') {
        const orderTotalPriceFromBackend = createdOrder.totalPrice;
        const createRazorpayOrderRequest = { amount: orderTotalPriceFromBackend, currency: "INR", receipt: createdOrder.id.toString() };
        const razorpayOrderResponse = await apiClient.post('/payments/create-razorpay-order', createRazorpayOrderRequest);
        const rzpOrderData = razorpayOrderResponse.data;
  
        const options = {
          key: rzpOrderData.razorpayKeyId,
          amount: rzpOrderData.amountInPaise.toString(),
          currency: rzpOrderData.currency,
          name: "Your Restaurant Name",
          description: `Order #${createdOrder.id}`,
          order_id: rzpOrderData.razorpayOrderId,
          handler: async (response) => {
            try {
              const verificationPayload = { internalOrderId: createdOrder.id, ...response };
              const verifyResponse = await apiClient.post('/payments/verify-payment', verificationPayload);
  
              if (verifyResponse.data && verifyResponse.data.success) {
                const backendData = verifyResponse.data;
                setCartItems([]);
                setTimeout(() => {
                  navigate('/order-success', {
                    replace: true,
                    state: { orderDetails: { ...backendData, qrCodeIdentifier } }
                  });
                }, 0);
              } else {
                throw new Error(verifyResponse.data?.message || 'Payment verification failed.');
              }
            } catch (verifyError) {
              const verifyErrMsg = verifyError.response?.data?.message || "Could not verify payment.";
              setPaymentError(verifyErrMsg);
              toast.error(verifyErrMsg);
              setIsProcessingPayment(false);
            }
          },
          modal: { 
            ondismiss: async () => { 
              toast.warn("Payment was not completed."); 
              setIsProcessingPayment(false);
              
              // Cancel the order when modal is dismissed
              try {
                await apiClient.put(`/orders/${internalOrderId}/status`, { 
                  status: 'CANCELLED', 
                  cancellationReason: 'Customer closed payment window.' 
                });
                toast.info("Order cancelled successfully.");
              } catch (error) {
                console.error("Error cancelling order after modal dismissal:", error);
              }
            } 
          },
          notes: { internal_order_id: createdOrder.id.toString(), table_number: tableInfo.tableNumber },
          theme: { color: "#4F46E5" }
        };
  
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', async (response) => {
          const rzpErrorMsg = `Payment Failed: ${response.error.description || 'Unknown Error'}`;
          setPaymentError(rzpErrorMsg);
          toast.error(rzpErrorMsg);
          if (internalOrderId) {
            try {
              await apiClient.put(`/orders/${internalOrderId}/status`, { status: 'PAYMENT_FAILED', cancellationReason: `Razorpay: ${response.error.reason}` });
            } catch (e) { console.error("Error updating status to PAYMENT_FAILED:", e); }
          }
          setIsProcessingPayment(false);
        });
        rzp1.open();
      } else { // PAY_AT_COUNTER
        toast.success("Order placed successfully! Please pay at the counter.");
        setCartItems([]);
        setTimeout(() => {
          navigate('/order-success', {
            replace: true,
            state: {
              orderDetails: {
                internalOrderId: createdOrder.id,
                publicTrackingId: createdOrder.publicTrackingId,
                newStatus: createdOrder.status,
                qrCodeIdentifier: qrCodeIdentifier
              }
            }
          });
        }, 0);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to place order.';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
      setIsProcessingPayment(false);
    }
  };

  if (isLoading && !tableInfo) return <div className="min-h-screen flex items-center justify-center"><p className="text-lg">Loading Menu...</p></div>;
  if (error && !tableInfo) return <div className="min-h-screen flex items-center justify-center p-4"><div className="bg-white p-8 rounded-lg shadow-lg text-center"><h2 className="text-xl font-bold text-red-600">Error</h2><p>{error}</p></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {tableInfo && <h1 className="text-2xl font-bold text-gray-900">Table {tableInfo.tableNumber}</h1>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tableInfo && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="mb-6 overflow-x-auto"><div className="flex space-x-2 sm:space-x-4 pb-2 border-b">
                {categories.map(category => (
                  <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-3 py-2 sm:px-4 rounded-t-md text-sm font-medium whitespace-nowrap focus:outline-none ${selectedCategory === category.id ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>{category.name}</button>
                ))}
              </div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(dishesByCategoryId[selectedCategory] || []).map(dish => (
                  <div key={dish.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col">
                    {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="w-full h-40 object-cover rounded-md mb-4"/> : <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md mb-4 text-gray-400">No Image</div>}
                    <div className="flex-1 flex flex-col">
                        <h4 className="text-lg font-semibold text-gray-800">{dish.name}</h4>
                        {dish.description && <p className="mt-1 text-sm text-gray-600 flex-grow">{dish.description}</p>}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xl font-bold text-indigo-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(dish.price)}</span>
                      <button onClick={() => handleAddToCart(dish)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add to Cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white p-6 rounded-lg shadow-xl sticky top-24">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Your Order</h2>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8"><p className="text-sm text-gray-500">Your cart is empty.</p></div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
                      {cartItems.map(item => (
                        <div key={item.dishId} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex-1 mr-2"><h4 className="text-sm font-medium text-gray-700 truncate">{item.dishName}</h4><p className="text-xs text-gray-500">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)}</p></div>
                          <div className="flex items-center space-x-2"><button onClick={() => handleDecrementQuantity(item.dishId)} className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">-</button><span className="text-sm font-medium text-gray-800 w-5 text-center">{item.quantity}</span><button onClick={() => handleIncrementQuantity(item.dishId)} className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">+</button></div>
                          <div className="ml-2 w-20 text-right text-sm font-medium text-gray-800">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}</div>
                          <button onClick={() => handleRemoveItem(item.dishId)} className="ml-2 p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between items-center mb-4"><span className="text-base font-semibold text-gray-900">Total</span><span className="text-xl font-bold text-indigo-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cartTotal)}</span></div>
                      
                      {/* --- THIS IS THE CORRECTED BUTTON --- */}
                      <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        disabled={isProcessingPayment || cartItems.length === 0}
                        className="w-full px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Place Order
                      </button>
                      
                      {paymentError && <p className="mt-3 text-sm text-center text-red-600">{paymentError}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- THIS IS THE NEW MODAL --- */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Confirm Your Order</h2>
            <div className="text-center mb-6">
              <p className="text-gray-600">Your order total is:</p>
              <p className="text-3xl font-bold text-indigo-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cartTotal)}</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => handlePaymentChoice('ONLINE')}
                disabled={isProcessingPayment}
                className="w-full px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessingPayment ? 'Processing...' : 'Pay Online Now'}
              </button>
              <button
                onClick={() => handlePaymentChoice('PAY_AT_COUNTER')}
                disabled={isProcessingPayment}
                className="w-full px-4 py-3 bg-gray-700 text-white text-base font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Pay at Counter
              </button>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isProcessingPayment}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
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

export default CustomerMenuPage;