import React, { useState, useEffect } from 'react';
import { JobsAPI } from '../services/api';
import { Modal, AlertModal, ConfirmModal } from '../components/Modal';
import * as XLSX from 'xlsx';

// Helper function to get today's date in ISO format (YYYY-MM-DD)
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(getTodayDate());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [dateOptions, setDateOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    company: '',
    date: '',
    tech: '',
    url: '',
    description: '',
  });
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  useEffect(() => {
    initializeDateFilter();
    loadJobs();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [currentPage, pageSize, dateFilter]);

  const initializeDateFilter = () => {
    const today = new Date();
    const options = [{ value: '', label: 'All Dates' }];

    for (let i = 2; i >= -30; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${month}.${day}`;
      const isoDate = `${year}-${month}-${day}`;
      options.push({ value: isoDate, label: dateString });
    }

    setDateOptions(options);
  };

  const loadJobs = async (search = null) => {
    try {
      setLoading(true);
      const data = await JobsAPI.getAll(dateFilter || null, currentPage, pageSize, search || searchTerm, 'DESC');
      setJobs(data.jobs || []);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalJobs(data.pagination.total);
    } catch (error) {
      showAlert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const showConfirm = (title, message, callback) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmCallback(() => callback);
    setConfirmOpen(true);
  };

  const handleAddJob = () => {
    setEditingJob(null);
    setFormData({
      id: '',
      title: '',
      company: '',
      date: '',
      tech: '',
      url: '',
      description: '',
    });
    setModalOpen(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    let formattedDate = '';
    if (job.date) {
      const d = new Date(job.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      formattedDate = `${yyyy}-${mm}-${dd}`;
    }
    setFormData({
      id: job.id,
      title: job.title,
      company: job.company,
      date: formattedDate,
      tech: job.tech || '',
      url: job.url || '',
      description: job.description || '',
    });
    setModalOpen(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await JobsAPI.update(
          editingJob.id,
          formData.title,
          formData.company,
          formData.date,
          formData.tech,
          formData.url,
          formData.description
        );
        showAlert('Success', 'Job updated successfully!');
      } else {
        await JobsAPI.create(
          parseInt(formData.id),
          formData.title,
          formData.company,
          formData.tech,
          formData.url,
          formData.description
        );
        showAlert('Success', 'Job added successfully!');
      }
      setModalOpen(false);
      loadJobs();
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const handleDeleteJob = (job) => {
    showConfirm('Delete Job', 'Are you sure you want to delete this job?', async () => {
      try {
        await JobsAPI.delete(job.id);
        showAlert('Success', 'Job deleted successfully!');
        loadJobs();
      } catch (error) {
        showAlert('Error', error.message);
      }
    });
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearDateFilter = () => {
    setDateFilter('');
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadJobs(searchTerm);
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

  const copyTodayJobs = async () => {
    try {
      const data = await JobsAPI.getAll(dateFilter || null, 1, 10000, searchTerm, 'ASC');
      const jobsToCopy = data.jobs || [];

      if (jobsToCopy.length === 0) {
        showAlert('No Data', 'No jobs to copy. Please add some jobs first.');
        return;
      }

      const headers = ['Job ID', 'Title', 'Company', 'Tech Stack', 'URL', 'Description', 'Date', 'Created At', 'Updated At'];
      const csvData = [headers];

      jobsToCopy.forEach((job) => {
        const cleanDescription = (job.description || '').replace(/\n/g, ' ').replace(/\t/g, ' ').trim();
        csvData.push([
          job.id,
          job.title,
          job.company,
          job.tech || '',
          job.url || '',
          cleanDescription,
          new Date(job.date).toLocaleDateString(),
          new Date(job.created_at).toLocaleDateString(),
          job.updated_at ? new Date(job.updated_at).toLocaleDateString() : '',
        ]);
      });

      const tsv = csvData.map((row) => row.join('\t')).join('\n');

      try {
        await navigator.clipboard.writeText(tsv);
        showAlert('Success', `Copied ${jobsToCopy.length} jobs to clipboard!`);
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = tsv;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showAlert('Success', `Copied ${jobsToCopy.length} jobs to clipboard!`);
      }
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const exportJobsToExcel = async () => {
    try {
      const data = await JobsAPI.getAll(dateFilter || null, 1, 10000, searchTerm, 'ASC');
      const jobsToExport = data.jobs || [];

      if (jobsToExport.length === 0) {
        showAlert('No Data', 'No jobs to export. Please add some jobs first.');
        return;
      }

      const worksheetData = jobsToExport.map((job) => ({
        'Job ID': job.id,
        Title: job.title,
        Company: job.company,
        'Tech Stack': job.tech || '',
        URL: job.url || '',
        Description: (job.description || '').replace(/\n/g, ' ').trim(),
        Date: new Date(job.date).toLocaleDateString(),
        'Created At': new Date(job.created_at).toLocaleDateString(),
        'Updated At': job.updated_at ? new Date(job.updated_at).toLocaleDateString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

      const fileName = `jobs_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showAlert('Success', `Exported ${jobsToExport.length} jobs to Excel!`);
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const startItem = totalJobs === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalJobs);
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
        <div className="flex gap-2">
          <button
            onClick={copyTodayJobs}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            📋 Copy Today Jobs
          </button>
          <button
            onClick={exportJobsToExcel}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            📊 Save to Excel
          </button>
          <button
            onClick={handleAddJob}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
          >
            + Add Job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleClearDateFilter}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            🗑️ Clear Date
          </button>
          <button
            onClick={() => loadJobs()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading jobs...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tech Stack</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        No jobs found
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{job.id}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={job.title}>
                          {job.title
                            ? job.title.length > 40
                              ? job.title.substring(0, 40) + '...'
                              : job.title
                            : <em>No title</em>
                          }
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{job.company}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.tech || <em>Not specified</em>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          {job.url ? (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              🔗 View
                            </a>
                          ) : (
                            <em className="text-gray-500">No URL</em>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate" title={job.description}>
                          {job.description
                            ? job.description.length > 50
                              ? job.description.substring(0, 50) + '...'
                              : job.description
                            : <em>No description</em>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.date}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleDateString("UTC")}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditJob(job)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalJobs > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {startItem}-{endItem} of {totalJobs}
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
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingJob ? 'Edit Job' : 'Add New Job'}
      >
        <form onSubmit={handleSaveJob}>
          {!editingJob && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job ID *</label>
              <input
                type="number"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="123"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Senior Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Tech Corp"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {editingJob && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
            <input
              type="text"
              value={formData.tech}
              onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
              placeholder="React, Node.js, PostgreSQL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/job/123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              placeholder="Job description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
          >
            {editingJob ? 'Update Job' : 'Add Job'}
          </button>
        </form>
      </Modal>

      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertTitle}
        message={alertMessage}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={confirmCallback}
      />
    </div>
  );
};

export default Jobs;
