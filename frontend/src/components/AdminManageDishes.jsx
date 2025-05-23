import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';
import { toast } from 'react-toastify';
import DishForm from './DishForm';

function AdminManageDishes() {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    available: true
  });

  // Function to fetch dishes
  const fetchDishes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/menu/dishes', {
        params: {
          page: currentPage,
          size: pageSize
        }
      });
      console.log('API Response:', response.data);
      
      if (response.data && response.data.content) {
        setDishes(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
        console.log('Pagination Info:', {
          currentPage,
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements,
          contentLength: response.data.content.length
        });
      } else {
        // If response is not paginated, create pagination manually
        const allDishes = response.data || [];
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedDishes = allDishes.slice(startIndex, endIndex);
        
        setDishes(paginatedDishes);
        setTotalPages(Math.ceil(allDishes.length / pageSize));
        setTotalElements(allDishes.length);
        
        console.log('Manual Pagination:', {
          currentPage,
          totalPages: Math.ceil(allDishes.length / pageSize),
          totalElements: allDishes.length,
          paginatedDishesLength: paginatedDishes.length
        });
      }
    } catch (err) {
      console.error('Failed to fetch dishes:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dishes.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/menu/categories');
      if (response.data && response.data.content) {
        setCategories(response.data.content);
      } else {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toast.error('Failed to load categories. Some features may be limited.');
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchCategories();
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAddDish = () => {
    setEditingDish(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      imageUrl: '',
      available: true
    });
    setIsFormVisible(true);
  };

  const handleEditDish = (dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || '',
      price: dish.price.toString(),
      categoryId: dish.categoryId.toString(),
      imageUrl: dish.imageUrl || '',
      available: dish.available
    });
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingDish(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      imageUrl: '',
      available: true
    });
  };

  const handleDeleteDish = async (dishId) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      try {
        await apiClient.delete(`/menu/dishes/${dishId}`);
        toast.success('Dish deleted successfully!');
        fetchDishes();
      } catch (err) {
        console.error('Failed to delete dish:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete dish.';
        toast.error(errorMessage);
      }
    }
  };

  const handleFormSubmit = async (dishData) => {
   
    if (!dishData.name.trim()) {
      toast.warning('Dish name is required.');
      return;
    }
    if (!dishData.price || isNaN(dishData.price) || parseFloat(dishData.price) <= 0) {
      toast.warning('Please enter a valid price.');
      return;
    }
    if (!dishData.categoryId) {
      toast.warning('Please select a category.');
      return;
    }

    try {
      const payload = {
        ...dishData,
        price: parseFloat(dishData.price),
        categoryId: parseInt(dishData.categoryId),
        available: Boolean(dishData.available)
      };

      if (editingDish) {
        await apiClient.put(`/menu/dishes/${editingDish.id}`, payload);
        toast.success('Dish updated successfully!');
      } else {
        await apiClient.post('/menu/dishes', payload);
        toast.success('Dish created successfully!');
      }
      setIsFormVisible(false);
      setEditingDish(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
        available: true
      });
      fetchDishes();
    } catch (err) {
      console.error('Failed to save dish:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save dish.';
      toast.error(errorMessage);
    }
  };

  if (isLoading && dishes.length === 0) return <p>Loading dishes...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Dishes</h2>
      <button 
        onClick={handleAddDish} 
        disabled={isFormVisible}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        Add New Dish
      </button>

      {isFormVisible && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingDish ? 'Edit Dish' : 'Add New Dish'}
          </h3>
          <DishForm
            initialData={editingDish}
            categories={categories}
            onSubmitForm={handleFormSubmit}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {dishes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dishes.map((dish) => (
                <tr key={dish.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dish.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dish.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dish.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dish.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(cat => cat.id === dish.categoryId)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditDish(dish)}
                      disabled={isFormVisible}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteDish(dish.id)}
                      disabled={isFormVisible}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No dishes found. Click "Add New Dish" to start.</p>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((currentPage + 1) * pageSize, totalElements)}
                </span>{' '}
                of <span className="font-medium">{totalElements}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageClick(index)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === index
                        ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageDishes; 