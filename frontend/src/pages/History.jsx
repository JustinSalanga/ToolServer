import React, { useState, useEffect } from 'react';
import { HistoryAPI } from '../services/api';

const History = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    user_id: '',
    action_type: '',
    entity_type: '',
  });

  useEffect(() => {
    loadHistory();
  }, [currentPage, pageSize, filters]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await HistoryAPI.getAll(
        currentPage,
        pageSize,
        filters.user_id || null,
        filters.action_type || null,
        filters.entity_type || null
      );
      setLogs(data.logs || []);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalLogs(data.pagination.total);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'sign_up':
        return 'bg-green-100 text-green-800';
      case 'login':
        return 'bg-blue-100 text-blue-800';
      case 'create':
        return 'bg-purple-100 text-purple-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return null;
    try {
      const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return metadata;
    }
  };

  const startItem = totalLogs === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalLogs);
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">History Logs</h1>
        <button
          onClick={loadHistory}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="number"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              placeholder="Filter by user ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Actions</option>
              <option value="sign_up">Sign Up</option>
              <option value="login">Login</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Entities</option>
              <option value="user">User</option>
              <option value="job">Job</option>
              <option value="block_list">Block List</option>
              <option value="setting">Setting</option>
              <option value="config">Config</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-8">Loading history logs...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No history logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{log.id}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.user_email || `User #${log.user_id}`}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.entity_type}
                          {log.entity_id && ` #${log.entity_id}`}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.description}>
                          {log.description || <em>No description</em>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || <em>N/A</em>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalLogs > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {startItem}-{endItem} of {totalLogs}
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 border rounded-md ${
                          page === currentPage
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Last
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Items per page:</label>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;

