import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';
import DishForm from './DishForm';

function AdminManageDishes() {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  // Function to fetch dishes
  const fetchDishes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/menu/dishes');
      if (response.data && response.data.content) {
        setDishes(response.data.content);
      } else {
        setDishes(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch dishes:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dishes.');
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
      setError(err.response?.data?.message || err.message || 'Failed to load categories.');
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchCategories();
  }, []);

  const handleAddDish = () => {
    setEditingDish(null);
    setIsFormVisible(true);
  };

  const handleEditDish = (dishId) => {
    const dishToEdit = dishes.find(dish => dish.id === dishId);
    if (dishToEdit) {
      setEditingDish(dishToEdit);
      setIsFormVisible(true);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingDish) {
        // Update existing dish
        await apiClient.put(`/menu/dishes/${editingDish.id}`, formData);
        alert('Dish updated successfully!');
      } else {
        // Create new dish
        await apiClient.post('/menu/dishes', formData);
        alert('Dish created successfully!');
      }
      setIsFormVisible(false);
      setEditingDish(null);
      fetchDishes(); // Refresh the list
    } catch (err) {
      console.error('Failed to save dish:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to save dish. Please try again.';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDish = async (dishId, dishName) => {
    if (window.confirm(`Are you sure you want to delete "${dishName}" (ID: ${dishId})? This action cannot be undone.`)) {
      try {
        await apiClient.delete(`/menu/dishes/${dishId}`);
        alert(`Dish "${dishName}" deleted successfully!`);
        fetchDishes(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete dish:', err);
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Failed to delete dish. It might be in use or an error occurred.';
        setError(errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingDish(null);
  };

  if (isLoading && dishes.length === 0) return <p>Loading dishes...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Manage Menu Dishes</h2>
      <button 
        onClick={handleAddDish} 
        style={{ marginBottom: '10px' }}
        disabled={isFormVisible}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Add New Dish
      </button>

      {isFormVisible && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>{editingDish ? 'Edit Dish' : 'Add New Dish'}</h3>
          <DishForm 
            initialData={editingDish}
            categories={categories}
            onSubmitForm={handleFormSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {dishes.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dishes.map((dish) => (
              <tr key={dish.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dish.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dish.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{dish.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dish.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dish.category?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dish.available ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleEditDish(dish.id)}
                    disabled={isFormVisible}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                    disabled={isFormVisible}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No dishes found. Click "Add New Dish" to start.</p>
      )}
    </div>
  );
}

export default AdminManageDishes; 