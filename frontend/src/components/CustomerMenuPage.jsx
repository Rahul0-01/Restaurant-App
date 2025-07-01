// src/components/CustomerMenuPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../services/apiService';

function CustomerMenuPage() {
    const { qrCodeIdentifier } = useParams();
    const navigate = useNavigate();

    const [tableInfo, setTableInfo] = useState(null);
    const [categories, setCategories] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [isProcessingItem, setIsProcessingItem] = useState(null);
    const [isRequestingBill, setIsRequestingBill] = useState(false);
    const [isCallingWaiter, setIsCallingWaiter] = useState(false);
    const [waiterCalled, setWaiterCalled] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!qrCodeIdentifier) {
                setError("No QR code found in URL.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const [tableResponse, categoriesResponse, dishesResponse] = await Promise.all([
                    apiClient.get(`/tables/qr/${qrCodeIdentifier}`),
                    apiClient.get('/menu/categories'),
                    apiClient.get('/menu/dishes?availableOnly=true')
                ]);

                const currentTableInfo = tableResponse.data;
                setTableInfo(currentTableInfo);
                const categoriesData = categoriesResponse.data?.content || [];
                setCategories(categoriesData);
                const allDishesData = dishesResponse.data?.content || dishesResponse.data || [];
                setAllDishes(allDishesData);

                if (categoriesData.length > 0) {
                    setSelectedCategoryId(categoriesData[0].id);
                }

                if (currentTableInfo.id) {
                    try {
                        const activeOrderRes = await apiClient.get(`/orders/table/${currentTableInfo.id}/active`);
                        setActiveOrder(activeOrderRes.data);
                    } catch (orderError) {
                        if (orderError.response && orderError.response.status === 404) {
                            console.log("No active order found. Ready for a new tab.");
                            setActiveOrder(null);
                        } else {
                            throw orderError;
                        }
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load page. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [qrCodeIdentifier]);

    const filteredDishes = useMemo(() => {
        if (!selectedCategoryId || allDishes.length === 0) return [];
        return allDishes.filter(dish => dish.categoryId === selectedCategoryId);
    }, [selectedCategoryId, allDishes]);

    const orderTotal = useMemo(() => activeOrder?.totalPrice || 0, [activeOrder]);

    const handleAddToOrder = async (dish) => {
        if (!tableInfo?.id) return;
        setIsProcessingItem(dish.id);
        try {
            const itemsPayload = [{ dishId: dish.id, quantity: 1 }];
            let updatedOrder;

            if (!activeOrder) {
                const newOrderPayload = { tableId: tableInfo.id, items: itemsPayload };
                const res = await apiClient.post('/orders', newOrderPayload);
                updatedOrder = res.data;
                toast.success(`${dish.name} added and your tab has started!`);
            } else {
                const res = await apiClient.post(`/orders/${activeOrder.id}/items`, { items: itemsPayload });
                updatedOrder = res.data;
                toast.success(`${dish.name} added to your tab!`);
            }
            setActiveOrder(updatedOrder);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add item.');
        } finally {
            setIsProcessingItem(null);
        }
    };

    const handleRequestBill = async () => {
        if (!activeOrder) return;
        setIsRequestingBill(true);
        try {
            const res = await apiClient.put(`/orders/${activeOrder.id}/request-bill`);
            navigate(`/bill/${res.data.publicTrackingId}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request bill.');
        } finally {
            setIsRequestingBill(false);
        }
    };
    
    const handleCallWaiter = async () => {
        if (!tableInfo?.id || waiterCalled) return;
        setIsCallingWaiter(true);
        try {
            await apiClient.post(`/tables/${tableInfo.id}/assistance`);
            setWaiterCalled(true);
            toast.success('A staff member has been notified.');
            setTimeout(() => setWaiterCalled(false), 30000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to call waiter.');
        } finally {
            setIsCallingWaiter(false);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-xl animate-pulse">Loading Restaurant...</p></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-red-500 text-xl">{error}</p></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {tableInfo && <h1 className="text-2xl font-bold text-gray-900">Table {tableInfo.tableNumber}</h1>}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    {/* Menu Section */}
                    <div className="lg:col-span-2">
                        <div className="mb-6 overflow-x-auto">
                            <div className="flex space-x-2 sm:space-x-4 pb-2 border-b">
                                {categories.map(category => (
                                    <button key={category.id} onClick={() => setSelectedCategoryId(category.id)} className={`px-3 py-2 sm:px-4 rounded-t-md text-sm font-medium whitespace-nowrap focus:outline-none ${selectedCategoryId === category.id ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredDishes.length > 0 ? (
                                filteredDishes.map(dish => (
                                    <div key={dish.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col hover:shadow-xl transition-shadow">
                                        {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="w-full h-40 object-cover rounded-md mb-4" /> : <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md mb-4 text-gray-400">No Image</div>}
                                        <div className="flex-1 flex flex-col">
                                            <h4 className="text-lg font-semibold text-gray-800">{dish.name}</h4>
                                            {dish.description && <p className="mt-1 text-sm text-gray-600 flex-grow">{dish.description}</p>}
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <span className="text-xl font-bold text-indigo-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(dish.price)}</span>
                                            <button onClick={() => handleAddToOrder(dish)} disabled={isProcessingItem === dish.id} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait">
                                                {isProcessingItem === dish.id ? 'Adding...' : 'Add to Order'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-gray-500">
                                    <p>No dishes available in this category.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab Summary Section */}
                    <div className="lg:col-span-1 mt-8 lg:mt-0">
                        <div className="bg-white p-6 rounded-lg shadow-xl sticky top-24">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Your Tab</h2>
                            {!activeOrder || activeOrder.items.length === 0 ? (
                                <div className="text-center py-8"><p className="text-sm text-gray-500">Your tab is empty. Add an item to get started!</p></div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
                                        {activeOrder.items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                                <div className="flex-1 mr-2"><h4 className="text-sm font-medium text-gray-700 truncate">{item.quantity} x {item.dishName}</h4></div>
                                                <div className="ml-2 w-20 text-right text-sm font-medium text-gray-800">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.lineItemTotal)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-200 mt-4 pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-base font-semibold text-gray-900">Running Total</span>
                                            <span className="text-xl font-bold text-indigo-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(orderTotal)}</span>
                                        </div>
                                        <button onClick={handleRequestBill} disabled={isRequestingBill} className="w-full px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                                            {isRequestingBill ? 'Requesting...' : 'View Bill & Checkout'}
                                        </button>
                                    </div>
                                </>
                            )}
                            <div className="border-t mt-4 pt-4">
                                <button onClick={handleCallWaiter} disabled={isCallingWaiter || waiterCalled} className="w-full px-4 py-2 bg-yellow-500 text-white text-base font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                                    {waiterCalled ? 'Waiter has been notified!' : isCallingWaiter ? 'Notifying...' : 'Call Waiter'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CustomerMenuPage;