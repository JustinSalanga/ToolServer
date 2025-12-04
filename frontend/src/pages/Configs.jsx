import React, { useState, useEffect } from 'react';
import { ConfigAPI } from '../services/api';
import { Modal, AlertModal, ConfirmModal } from '../components/Modal';

const Configs = () => {
  const [configs, setConfigs] = useState([]);
  const [filteredConfigs, setFilteredConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    filterConfigs();
  }, [searchTerm, configs]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await ConfigAPI.getAllConfigs();
      setConfigs(data.configs || []);
    } catch (error) {
      showAlert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterConfigs = () => {
    if (!searchTerm) {
      setFilteredConfigs(configs);
      return;
    }
    const filtered = configs.filter((config) =>
      config.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConfigs(filtered);
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

  const handleViewConfig = async (userEmail) => {
    setViewModalOpen(true);
    setLoadingConfig(true);
    setSelectedConfig(null);

    try {
      const data = await ConfigAPI.getConfig(userEmail);
      setSelectedConfig(data.config);
    } catch (error) {
      showAlert('Error', `Failed to load configuration: ${error.message}`);
      setViewModalOpen(false);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleDeleteConfig = (userEmail) => {
    showConfirm('Delete Configuration', `Are you sure you want to delete the configuration for ${userEmail}?`, async () => {
      try {
        await ConfigAPI.delete(userEmail);
        showAlert('Success', 'Configuration deleted successfully!');
        loadConfigs();
      } catch (error) {
        showAlert('Error', error.message);
      }
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Configurations</h1>
        <p className="text-gray-600">View user-specific configurations including prompts, resumes, templates, and folders</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={loadConfigs}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading configurations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Has Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Has Resume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folder Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No configurations found
                    </td>
                  </tr>
                ) : (
                  filteredConfigs.map((config) => (
                    <tr key={config.user_email}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {config.user_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            config.prompt
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.prompt ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            config.resume
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.resume ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-wrap text-wrap text-sm text-gray-500">
                        {config.template_path || <em>Not set</em>}
                      </td>
                      <td className="px-6 py-4 whitespace-wrap text-wrap text-sm text-gray-500">
                        {config.folder_path || <em>Not set</em>}
                      </td>
                      <td className="px-6 py-4 whitespace-wrap text-wrap text-sm text-gray-500">
                        {new Date(config.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-wrap text-wrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewConfig(config.user_email)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteConfig(config.user_email)}
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
        )}
      </div>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedConfig ? `Configuration for ${selectedConfig.user_email || 'User'}` : 'Configuration'}
      >
        {loadingConfig ? (
          <div className="text-center py-8">Loading configuration...</div>
        ) : selectedConfig ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">📝 Prompt</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {selectedConfig.prompt ? (
                  <pre className="whitespace-pre-wrap text-sm">{selectedConfig.prompt}</pre>
                ) : (
                  <em className="text-gray-500">Not set</em>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">📄 Resume</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {selectedConfig.resume ? (
                  <pre className="whitespace-pre-wrap text-sm">
                    {selectedConfig.resume.length > 500
                      ? selectedConfig.resume.substring(0, 500) + '...'
                      : selectedConfig.resume}
                  </pre>
                ) : (
                  <em className="text-gray-500">Not set</em>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">📋 Template Path</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {selectedConfig.template_path || <em className="text-gray-500">Not set</em>}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">📁 Folder Path</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {selectedConfig.folder_path || <em className="text-gray-500">Not set</em>}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">🕒 Timestamps</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-1">
                <p>
                  <strong>Created:</strong> {new Date(selectedConfig.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated:</strong> {new Date(selectedConfig.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No configuration data</div>
        )}
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

export default Configs;
