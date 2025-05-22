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

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/tables');
      if (response.data && response.data.content) {
        setTables(response.data.content);
      } else {
        setTables(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load tables.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = () => {
    setEditingTable(null);
    setIsFormVisible(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingTable(null);
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
    try {
      if (editingTable) {
        await apiClient.put(`/tables/${editingTable.id}`, formData);
        toast.success('Table updated successfully!');
      } else {
        await apiClient.post('/tables', formData);
        toast.success('Table created successfully!');
      }
      setIsFormVisible(false);
      setEditingTable(null);
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
    </div>
  );
}

export default AdminManageTables; 