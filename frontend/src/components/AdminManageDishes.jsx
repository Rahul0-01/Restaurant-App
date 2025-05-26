import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService'; // VERIFY PATH
import { toast } from 'react-toastify';
import DishForm from './DishForm'; // VERIFY PATH

// pageSize from your code
const pageSize = 10;

function AdminManageDishes() {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]); // For DishForm dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDish, setEditingDish] = useState(null); // Passed as initialData to DishForm

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // This formData state was in your previous version.
  // It's used to pre-fill DishForm IF DishForm doesn't manage its own state
  // from initialData prop. If DishForm *does* manage its own state via initialData,
  // this specific formData state in AdminManageDishes might be less critical
  // for the form itself, but useful for resetting.
  const [formData, setFormData] = useState({ // Keeping as per your provided code
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    available: true
  });

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
      //console.log('[AdminManageDishes] API Response for /menu/dishes:', JSON.stringify(response.data, null, 2)); // <<< DETAILED LOG

      if (response.data && typeof response.data.content !== 'undefined' && Array.isArray(response.data.content)) {
        // Backend IS sending a standard Page object
        console.log('[AdminManageDishes] Backend Paginating. Content length:', response.data.content.length);
        setDishes(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else if (Array.isArray(response.data)) {
        // Backend sent a flat array (NOT paginating, or structure is just the array)
        console.log('[AdminManageDishes] Backend sent flat array. Performing client-side pagination. Full list length:', response.data.length);
        const allDishes = response.data;
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedDishes = allDishes.slice(startIndex, endIndex);

        setDishes(paginatedDishes);
        setTotalPages(Math.ceil(allDishes.length / pageSize));
        setTotalElements(allDishes.length);
      } else {
        console.warn('[AdminManageDishes] Unexpected API response structure for dishes:', response.data);
        setDishes([]);
        setTotalPages(0);
        setTotalElements(0);
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
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Only re-fetch when currentPage changes

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
    // Reset formData to defaults for a new dish
    setFormData({
      name: '', description: '', price: '', categoryId: '', imageUrl: '', available: true
    });
    setIsFormVisible(true);
  };

  const handleEditDish = (dish) => {
    setEditingDish(dish);
    // Set formData from the dish being edited (DishForm will use this via initialData)
    setFormData({
      name: dish.name,
      description: dish.description || '',
      price: dish.price ? dish.price.toString() : '', // Ensure price is string for input
      categoryId: dish.category?.id?.toString() || dish.categoryId?.toString() || '', // Handle nested or direct categoryId
      imageUrl: dish.imageUrl || '',
      available: dish.available ?? true // Use ?? for boolean to handle false correctly
    });
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingDish(null);
    // Reset formData
    setFormData({ name: '', description: '', price: '', categoryId: '', imageUrl: '', available: true });
  };

  const handleDeleteDish = async (dishId, dishName) => { // Added dishName
    if (window.confirm(`Are you sure you want to delete "${dishName}"?`)) { // Use dishName
      try {
        await apiClient.delete(`/menu/dishes/${dishId}`);
        toast.success(`Dish "${dishName}" deleted successfully!`);
        if (dishes.length === 1 && currentPage > 0) { // Go to prev page if last item on current page deleted
            setCurrentPage(prev => prev - 1);
        } else {
            fetchDishes();
        }
      } catch (err) {
        console.error('Failed to delete dish:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete dish.';
        toast.error(errorMessage);
      }
    }
  };

  // This handleFormSubmit receives data from DishForm
  const handleFormSubmit = async (submittedDishData) => {
    // Client-side validation is now primarily in DishForm
    // submittedDishData should already have types converted by DishForm's handleSubmit
    try {
      const payload = submittedDishData; // Use data directly from DishForm

      if (editingDish && editingDish.id) { // Check if editingDish (from state) has an id
        await apiClient.put(`/menu/dishes/${editingDish.id}`, payload);
        toast.success('Dish updated successfully!');
      } else {
        await apiClient.post('/menu/dishes', payload);
        toast.success('Dish created successfully!');
      }
      setIsFormVisible(false);
      setEditingDish(null);
      // Reset internal formData state (though DishForm manages its own now)
      setFormData({ name: '', description: '', price: '', categoryId: '', imageUrl: '', available: true });
      fetchDishes();
    } catch (err) {
      console.error('Failed to save dish:', err);
      const errorMessage = err.response?.data?.message || 
                          (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) || 
                          err.message || 
                          'Failed to save dish.';
      // setError(errorMessage); // Set general error state if you want to display it persistently
      toast.error(errorMessage);
    }
  };

  if (isLoading && dishes.length === 0) return <p className="text-center py-10">Loading dishes...</p>;
  if (error && dishes.length === 0) return <p className="text-center py-10 text-red-600">Error: {error}</p>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Dishes</h2>
      <button 
        onClick={handleAddDish} 
        disabled={isFormVisible}
        className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        Add New Dish
      </button>

      {error && !isFormVisible && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {isFormVisible && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {editingDish ? 'Edit Dish' : 'Add New Dish'}
          </h3>
          <DishForm
            initialData={editingDish} // Pass editingDish as initialData
            categories={categories}
            onSubmitForm={handleFormSubmit}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {!isLoading && dishes.length === 0 && !error && (
          <p className="text-center py-10 text-gray-500">No dishes found. Click "Add New Dish" to start.</p>
      )}

      {dishes.length > 0 && (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th> {/* ADDED */}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Available</th> {/* ADDED */}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dishes.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dish.id}</td>
                  {/* ADDED IMAGE CELL */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dish.imageUrl ? (
                      <img src={dish.imageUrl} alt={dish.name} className="h-12 w-12 object-cover rounded-md shadow-sm" />
                    ) : (
                      <span className="text-gray-400 italic text-xs">No Image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dish.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={dish.description}>
                    {dish.description || <span className="text-gray-400 italic">N/A</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dish.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {categories.find(cat => cat.id === (dish.category?.id || dish.categoryId))?.name || <span className="text-gray-400 italic">N/A</span>}
                  </td>
                  {/* ADDED AVAILABLE CELL */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        dish.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {dish.available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditDish(dish)}
                      disabled={isFormVisible}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit Dish"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteDish(dish.id, dish.name)} // Pass dish.name for confirmation
                      disabled={isFormVisible}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Dish"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls - Copied from your OrderManagementPage, assuming similar styling and logic */}
      {totalPages > 1 && (
         <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 shadow-md rounded-lg">
         <div className="flex flex-1 justify-between sm:hidden">
           <button onClick={handlePreviousPage} disabled={currentPage === 0} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
           <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
         </div>
         <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
           <div>
             <p className="text-sm text-gray-700">
               Showing <span className="font-medium">{Math.min(currentPage * pageSize + 1, totalElements)}</span>
               to <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalElements)}</span>
               of <span className="font-medium">{totalElements}</span> results
             </p>
           </div>
           <div>
             <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
               <button onClick={handlePreviousPage} disabled={currentPage === 0} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">«</button>
               {[...Array(totalPages).keys()].map((pageNumber) => (
                 <button
                   key={pageNumber}
                   onClick={() => handlePageClick(pageNumber)}
                   className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                     currentPage === pageNumber
                       ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-indigo-600'
                       : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                   }`}
                 >
                   {pageNumber + 1}
                 </button>
               ))}
               <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">»</button>
             </nav>
           </div>
         </div>
       </div>
      )}
    </div>
  );
}

export default AdminManageDishes;