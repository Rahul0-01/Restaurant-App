import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService'; // Import our authenticated API client
import { useAuth } from '../context/AuthContext'; // To check if authenticated, though apiClient handles token

function MenuCategories() {
  const [categories, setCategories] = useState([]); // To store the list of categories
  const [isLoading, setIsLoading] = useState(true); // To show a loading indicator
  const [error, setError] = useState(null); // To store any error messages
  const { isAuthenticated } = useAuth(); // Get authentication status

  useEffect(() => {
    // Only fetch categories if the user is authenticated
    // Although apiClient includes the token, this check can prevent unnecessary calls
    // if the component somehow renders when the user is not authenticated.
    if (isAuthenticated) {
      const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Use our apiClient to make the GET request
          // The '/menu/categories' endpoint is public (GET), but using apiClient is fine
          // and good practice for consistency if other menu endpoints become protected.
          const response = await apiClient.get('/menu/categories');

          // Your backend for GET /api/menu/categories returns a Page<CategoryDTO>
          // So, the actual list of categories will be in response.data.content
          if (response.data && response.data.content) {
            setCategories(response.data.content);
          } else {
            // If the structure is different, adjust here.
            // For example, if it's just an array of CategoryDTO directly:
            // setCategories(response.data);
            console.warn("Categories data not found in response.data.content. Response:", response.data);
            setCategories([]); // Set to empty array if data is not as expected
          }
        } catch (err) {
          console.error('Failed to fetch menu categories:', err);
          setError(err.response?.data?.message || err.message || 'Failed to load categories.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchCategories();
    } else {
      // If not authenticated, you might want to clear categories or set an error
      // Or this component might simply not be rendered by the router.
      setIsLoading(false);
      // setError("You must be logged in to view categories."); // Optional
    }
  }, [isAuthenticated]); // Re-run effect if isAuthenticated changes

  if (isLoading) {
    return <p>Loading categories...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!isAuthenticated) {
    // This might be redundant if routing handles it, but good for direct component use.
    return <p>Please log in to view categories.</p>;
  }

  return (
    <div>
      <h3>Menu Categories</h3>
      {categories.length > 0 ? (
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              {category.name} - <i>{category.description}</i>
            </li>
          ))}
        </ul>
      ) : (
        <p>No categories found.</p>
      )}
    </div>
  );
}

export default MenuCategories;