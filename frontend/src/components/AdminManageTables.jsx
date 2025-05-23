import React, { useState, useEffect } from 'react';
import TableForm from './TableForm';
import apiClient from '../services/apiService';
import { toast } from 'react-toastify';

function AdminManageTables() {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    status: 'AVAILABLE'
  });

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/tables', {
        params: {
          page: currentPage,
          size: pageSize
        }
      });
      console.log('API Response:', response.data);
      
      if (response.data && response.data.content) {
        setTables(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        const allTables = response.data || [];
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTables = allTables.slice(startIndex, endIndex);
        
        setTables(paginatedTables);
        setTotalPages(Math.ceil(allTables.length / pageSize));
        setTotalElements(allTables.length);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tables.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
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

  const handleAddTable = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: '',
      capacity: '',
      status: 'AVAILABLE'
    });
    setIsFormVisible(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status
    });
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingTable(null);
    setFormData({
      tableNumber: '',
      capacity: '',
      status: 'AVAILABLE'
    });
  };

  const handleDeleteTable = async (tableId) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        await apiClient.delete(`/tables/${tableId}`);
        toast.success('Table deleted successfully!');
        fetchTables();
      } catch (err) {
        console.error('Failed to delete table:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete table.';
        toast.error(errorMessage);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!formData.tableNumber || !formData.capacity) {
      toast.warning('Table number and capacity are required.');
      return;
    }

    try {
      const payload = {
        tableNumber: formData.tableNumber.trim(),
        capacity: parseInt(formData.capacity),
        status: formData.status
      };

      if (editingTable) {
        await apiClient.put(`/tables/${editingTable.id}`, payload);
        toast.success('Table updated successfully!');
      } else {
        await apiClient.post('/tables', payload);
        toast.success('Table created successfully!');
      }
      setIsFormVisible(false);
      setEditingTable(null);
      setFormData({
        tableNumber: '',
        capacity: '',
        status: 'AVAILABLE'
      });
      fetchTables();
    } catch (err) {
      console.error('Failed to save table:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save table.';
      toast.error(errorMessage);
    }
  };

  if (isLoading && tables.length === 0) return <p>Loading tables...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Restaurant Tables</h2>
      <button 
        onClick={handleAddTable} 
        disabled={isFormVisible}
        className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        Add New Table
      </button>

      {isFormVisible && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingTable ? 'Edit Table' : 'Add New Table'}
          </h3>
          <TableForm 
            initialData={editingTable}
            onSubmitForm={handleFormSubmit}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {tables.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map((table) => (
                <tr key={table.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{table.tableNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.capacity === null || table.capacity === undefined ? 'N/A' : table.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.qrCodeIdentifier || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditTable(table)}
                      disabled={isFormVisible}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTable(table.id)}
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
        <p className="text-gray-500">No tables found. Click "Add New Table" to start.</p>
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

export default AdminManageTables; 