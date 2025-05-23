import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiService';
import { toast } from 'react-toastify';
import CategoryForm from './CategoryForm'; // Your existing CategoryForm

// --- SVG Icon Components (Copied from previous correct version) ---
const PlusIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PencilSquareIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);
const TrashIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
const ChevronLeftIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);
const ChevronRightIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);
// Example Square3Stack3DIcon if needed for empty state (you can get the SVG for this from previous responses or use your own)
const Square3Stack3DIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10.5 11.25h3M12 15h.008" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M17.25 4.5l-1.5 1.5L12 4.5l-3.75 1.5L4.5 4.5m12.75 0l-1.5 1.5L12 4.5" />
  </svg>
);
// --- End SVG Icon Components ---


function AdminManageCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const fetchCategories = async (pageToFetch = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/menu/categories', {
        params: { page: pageToFetch, size: pageSize },
      });
      if (response.data && response.data.content) {
        setCategories(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
        setCurrentPage(pageToFetch); // Ensure currentPage state matches fetched page
      } else {
        const allCategories = response.data || [];
        const startIndex = pageToFetch * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedCategories = allCategories.slice(startIndex, endIndex);
        setCategories(paginatedCategories);
        setTotalPages(Math.ceil(allCategories.length / pageSize));
        setTotalElements(allCategories.length);
        setCurrentPage(pageToFetch); // Ensure currentPage state matches fetched page
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load categories.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage]); // Trigger fetch when currentPage changes by user interaction

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

  const handleAddCategoryClick = () => {
    setEditingCategory(null); // Clear any editing state
    setIsFormVisible(true);
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategory(category);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await apiClient.delete(`/menu/categories/${categoryId}`);
        toast.success('Category deleted successfully!');
        // If last item on current page is deleted, try to go to previous page or refetch.
        if (categories.length === 1 && currentPage > 0) {
            setCurrentPage(prev => prev - 1); // This will trigger useEffect to fetch
        } else {
            fetchCategories(currentPage); // Refetch current page data
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete category.';
        toast.error(errorMessage);
      }
    }
  };

  // This function now handles the API submission logic, using data from CategoryForm
  const handleFormSubmit = async (formDataFromChild) => {
    if (!formDataFromChild.name.trim()) {
      toast.warning('Category name is required.');
      return;
    }

    const payload = {
      name: formDataFromChild.name.trim(),
      description: formDataFromChild.description.trim()
    };

    setIsLoading(true); // Optional: Set loading state during form submission
    try {
      if (editingCategory) { // Editing existing category
        await apiClient.put(`/menu/categories/${editingCategory.id}`, payload);
        toast.success('Category updated successfully!');
      } else { // Creating new category
        await apiClient.post('/menu/categories', payload);
        toast.success('Category created successfully!');
      }
      setIsFormVisible(false);
      setEditingCategory(null);
      // Determine which page to fetch after submission
      if (!editingCategory) { // If created new, go to first page or last page depending on API/preference
        fetchCategories(0); // Go to first page to see new item (most common)
      } else {
        fetchCategories(currentPage); // If edited, refetch current page
      }
    } catch (err) {
      console.error('Failed to save category:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save category.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false); // Clear loading state
    }
  };


  // --- UI Styles (from previous updated version) ---
  const primaryButtonStyles = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
  const secondaryButtonStyles = "inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
  const dangerButtonStyles = "inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";


  if (isLoading && categories.length === 0 && !isFormVisible && !error) return ( // Only show full page loader if no categories and not showing form
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"> {/* Adjust min-height as needed */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
        <p className="ml-4 text-lg text-slate-600">Loading Categories...</p>
    </div>
  );

  if (error && !isFormVisible) return ( // Show error prominently if form is not visible
    <div className="m-auto max-w-lg p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-md">
      <p className="font-bold text-lg">Error Occurred</p>
      <p className="mt-1">{error}</p>
      <button onClick={() => fetchCategories(0)} className={`${secondaryButtonStyles} mt-4`}>Try Again</button>
    </div>
  );
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manage Categories</h1>
          {!isFormVisible && (
            <button
              onClick={handleAddCategoryClick}
              className={`${primaryButtonStyles}`}
              disabled={isLoading} // Disable if loading categories initially
            >
              <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
              Add New Category
            </button>
          )}
        </div>

        {isFormVisible && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-xl transition-all duration-300 ease-in-out">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <CategoryForm
              initialData={editingCategory} // Pass editingCategory directly, or null if new
              onSubmitForm={handleFormSubmit} // This is the parent's submit handler
              onCancel={handleCancelForm}
              // No need to pass apiClient or toast if CategoryForm does not use them
            />
             {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>} {/* Display error related to form submission here if needed */}
          </div>
        )}

        {/* More subtle loading indicator when table data is being refetched but form might be visible */}
        {isLoading && (categories.length > 0 || isFormVisible) && (
             <div className="text-center py-4 text-slate-500 animate-pulse">Loading data...</div>
        )}

        {!isLoading && categories.length === 0 && !isFormVisible && (
            <div className="text-center py-10 bg-white rounded-lg shadow-md">
                <Square3Stack3DIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No categories found</h3>
                <p className="mt-1 text-sm text-slate-500">Get started by adding a new category.</p>
                <div className="mt-6">
                <button
                    onClick={handleAddCategoryClick}
                    type="button"
                    className={primaryButtonStyles}
                >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Category
                </button>
                </div>
            </div>
        )}

        {categories.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {categories.map((category) => (
                  <tr key={category.id} className={`hover:bg-slate-50 transition-colors ${isLoading ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 tabular-nums">{category.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={category.description}>
                        {category.description || <span className="italic text-slate-400">No description</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEditCategoryClick(category)}
                        disabled={isFormVisible || isLoading}
                        className={`${secondaryButtonStyles} px-2.5 py-1`}
                        title="Edit Category"
                      >
                        <PencilSquareIcon className="h-4 w-4 inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isFormVisible || isLoading}
                        className={`${dangerButtonStyles} px-2.5 py-1`}
                        title="Delete Category"
                      >
                         <TrashIcon className="h-4 w-4 inline mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg shadow-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 0 || isLoading}
                className={secondaryButtonStyles}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1 || isLoading}
                className={`${secondaryButtonStyles} ml-3`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{totalElements > 0 ? currentPage * pageSize + 1 : 0}</span> to{' '}
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
                    disabled={currentPage === 0 || isLoading}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-100 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageClick(index)}
                      aria-current={currentPage === index ? 'page' : undefined}
                      disabled={isLoading}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors ${
                        currentPage === index
                          ? 'z-10 bg-sky-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600'
                          : 'text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100 focus:z-20 focus:outline-offset-0'
                      } ${isLoading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1 || isLoading}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-100 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManageCategories;