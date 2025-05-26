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
  const [error, setError] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
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
      
      const categoriesData = categoriesResponse.data.content || categoriesResponse.data;
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
      
      const dishesData = dishesResponse.data.content || dishesResponse.data;
      const groupedDishes = dishesData.reduce((acc, dish) => {
        const categoryId = dish.category?.id || dish.categoryId;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(dish);
        return acc;
      }, {});
      
      setDishesByCategoryId(groupedDishes);
    } catch (err) {
      const errorMessage = err.response?.status === 404
        ? 'Invalid QR code. Please scan a valid table QR code.'
        : err.response?.data?.message || err.message || 'Failed to load menu data.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handlePlaceOrder = useCallback(async () => {
    if (cartItems.length === 0 || !tableInfo?.id) {
      toast.warning('Please add items to your cart before placing an order.');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);
    setOrderSuccess(null);

    try {
      const orderPayload = {
        tableId: tableInfo.id,
        notes: "",
        items: cartItems.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity
        }))
      };

      const response = await apiClient.post('/orders', orderPayload);
      setOrderSuccess({
        message: 'Order placed successfully!',
        orderId: response.data.id
      });
      setCartItems([]);
      toast.success('Order placed successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  }, [cartItems, tableInfo]);

  const cartTotal = useMemo(() => 
    cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    [cartItems]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {tableInfo && (
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Table {tableInfo.tableNumber}
              </h1>
              <div className="text-sm text-gray-500">
                Scan the QR code to view this menu
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orderSuccess && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{orderSuccess.message}</p>
                <p className="text-sm text-green-600">Order ID: {orderSuccess.orderId}</p>
              </div>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6 overflow-x-auto">
              <div className="flex space-x-4 pb-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dishesByCategoryId[selectedCategory]?.map(dish => (
                // Inside {dishesByCategoryId[selectedCategory]?.map(dish => ( ... ))}
<div key={dish.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"> {/* Added flex flex-col */}
  {/* Dish Image Section */}
  {dish.imageUrl ? (
    <img
      src={dish.imageUrl}
      alt={dish.name || 'Dish image'}
      className="w-full h-48 object-cover" // Image takes full width, fixed height, covers area
      onError={(e) => { // Fallback for broken image URLs
        e.target.onerror = null;
        e.target.style.display = 'none'; // Hide broken image icon
        // Optionally, show a placeholder div instead:
        // e.target.parentElement.innerHTML = '<div class="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">Image N/A</div>';
      }}
    />
  ) : (
    <div className="w-full h-48 bg-gray-200 flex items-center justify-center"> {/* Placeholder for no image */}
      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 7v10m0-10L12 3l8 4m-8-4v5m0 0L4 7m8 1v5m0 0l8-4m-8 4v5m0 0L4 17m8 1L4 13m8 5l8-4m-8-1L12 3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 7v10m0-10L12 3l8 4m-8-4v5m0 0L4 7m8 1v5m0 0l8-4m-8 4v5m0 0L4 17m8 1L4 13m8 5l8-4" /> {/** simple food icon placeholder */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-4z"></path>
      </svg>
    </div>
  )}

  {/* Dish Info Section */}
  <div className="p-6 flex-1 flex flex-col justify-between"> {/* Added flex-1 and flex flex-col */}
    <div> {/* Wrapper for text content */}
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-gray-900">{dish.name}</h3>
        <span className="text-lg font-medium text-indigo-600 whitespace-nowrap pl-2">
          ${dish.price.toFixed(2)}
        </span>
      </div>
      {dish.description && ( // Conditionally render description
        <p className="mt-1 text-sm text-gray-500">{dish.description}</p>
      )}
    </div>
    <div className="mt-4">
      <button
        onClick={() => handleAddToCart(dish)}
        className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add to Cart
      </button>
    </div>
  </div>
</div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Order</h2>
                
                {!cartItems || cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map(item => (
                        <div key={item.dishId} className="flex items-center justify-between py-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{item.dishName}</h4>
                            <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDecrementQuantity(item.dishId)}
                              className="p-1 text-gray-400 hover:text-gray-500"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-sm font-medium text-gray-900 w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleIncrementQuantity(item.dishId)}
                              className="p-1 text-gray-400 hover:text-gray-500"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.dishId)}
                              className="p-1 text-red-400 hover:text-red-500"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 mt-6 pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-medium text-gray-900">Total</span>
                        <span className="text-lg font-bold text-indigo-600">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder || cartItems.length === 0}
                        className="w-full px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPlacingOrder ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Place Order'
                        )}
                      </button>

                      {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerMenuPage; 