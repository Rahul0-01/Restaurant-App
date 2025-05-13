import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService'; 
import CategoryForm from './CategoryForm';

function AdminManageCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Function to fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/menu/categories');
      if (response.data && response.data.content) {
        setCategories(response.data.content);
      } else {
        setCategories(response.data || []); // Fallback if not paginated or different structure
      }
    } catch (err) {
      console.error('Failed to fetch categories for admin:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []); // Fetch on component mount

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsFormVisible(true);
  };

  const handleEditCategory = (categoryId) => {
    const categoryToEdit = categories.find(cat => cat.id === categoryId);
    if (categoryToEdit) {
      setEditingCategory(categoryToEdit);
      setIsFormVisible(true);
    }
  };

  const handleFormSubmit = async (formData) => { // Make it async
    setIsLoading(true); // Optional: Show a general loading state for the page
    setError(null);     // Clear previous errors
  
    try {
      if (editingCategory) {
        // EDIT MODE (PUT request)
        console.log('Attempting to UPDATE category ID:', editingCategory.id, 'with data:', formData);
        // Your DishRequestDTO for backend might be just { name, description }
        // Ensure formData matches what your backend PUT endpoint for categories expects.
        // Assuming your backend /api/menu/categories/{id} expects an object with name and description.
        await apiClient.put(`/menu/categories/${editingCategory.id}`, formData);
        alert('Category updated successfully!'); // Simple feedback
      } else {
        // ADD MODE (POST request)
        console.log('Attempting to ADD new category with data:', formData);
        // Ensure formData matches what your backend POST endpoint for categories expects.
        // Usually { name, description } for a new category.
        await apiClient.post('/menu/categories', formData);
        alert('Category added successfully!'); // Simple feedback
      }
      setIsFormVisible(false);
      setEditingCategory(null);
      fetchCategories(); // IMPORTANT: Re-fetch categories to see the changes
    } catch (err) {
      console.error('Failed to save category:', err);
      // err.response.data might contain specific validation messages from backend
      const errorMessage = err.response?.data?.message || // For custom error DTOs
                           (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) || // For Spring Validation errors
                           err.message ||
                           'Failed to save category. Please try again.';
      setError(errorMessage); // Display error to the user
      // Keep the form visible if there was an error so the user can correct it
      // setIsFormVisible(false); // DON'T hide form on error
    } finally {
      // If you set a global isLoading for the page, set it back here
      // setIsLoading(false);
      // Note: fetchCategories also sets isLoading, so be mindful of loading state management.
      // For now, we'll rely on fetchCategories to handle its own loading for the list.
    }
  };
  

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingCategory(null);
  };

  
const handleDeleteCategory = async (categoryId, categoryName) => { // Added categoryName for better confirm message
  console.log("Delete category clicked for ID:", categoryId, "Name:", categoryName);
  // Use categoryName in the confirmation for better UX
  if (window.confirm(`Are you sure you want to delete the category "${categoryName}" (ID: ${categoryId})? This action cannot be undone.`)) {
    // It's good practice to show some loading state if the delete takes time,
    // but for a quick operation, an alert on completion might be enough.
    // setError(null); // Clear previous errors

    try {
      await apiClient.delete(`/menu/categories/${categoryId}`);
      alert(`Category "${categoryName}" deleted successfully!`); // Simple feedback
      fetchCategories(); // IMPORTANT: Re-fetch categories to update the list
    } catch (err) {
      console.error('Failed to delete category:', err);
      const errorMessage = err.response?.data?.message ||
                           err.message ||
                           'Failed to delete category. It might be in use or an error occurred.';
      // Display error in a more prominent way if you have a dedicated error display area
      // For now, using alert for error as well, or you can use the existing setError state.
      alert(`Error deleting category: ${errorMessage}`);
      setError(errorMessage); // Also set the error state if you have an error display area
    }
  }
};

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Manage Menu Categories</h2>
      <button 
        onClick={handleAddCategory} 
        style={{ marginBottom: '10px' }}
        disabled={isFormVisible}
      >
        Add New Category
      </button>

      {isFormVisible && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <CategoryForm 
            initialData={editingCategory}
            onSubmitForm={handleFormSubmit}
          />
          <button 
            onClick={handleCancel}
            style={{ marginTop: '10px', marginLeft: '10px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {categories.length > 0 ? (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>
                  <button 
                    onClick={() => handleEditCategory(category.id)} 
                    style={{ marginRight: '5px' }}
                    disabled={isFormVisible}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id, category.name)} 
                    disabled={isFormVisible}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No categories found. Click "Add New Category" to start.</p>
      )}
    </div>
  );
}

export default AdminManageCategories;