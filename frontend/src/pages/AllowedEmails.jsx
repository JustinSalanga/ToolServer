import React, { useState, useEffect } from 'react';
import { AllowedEmailAPI } from '../services/api';
import { Modal, AlertModal, ConfirmModal } from '../components/Modal';

const AllowedEmails = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [formData, setFormData] = useState({ email: '' });
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  useEffect(() => {
    loadAllowedEmails();
  }, []);

  const loadAllowedEmails = async () => {
    try {
      setLoading(true);
      const data = await AllowedEmailAPI.getAll();
      setEmails(data.emails || []);
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

  const handleAddEmail = () => {
    setEditingEmail(null);
    setFormData({ email: '' });
    setModalOpen(true);
  };

  const handleEditEmail = (emailItem) => {
    setEditingEmail(emailItem);
    setFormData({ email: emailItem.email });
    setModalOpen(true);
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    try {
      if (editingEmail) {
        await AllowedEmailAPI.update(editingEmail.id, formData.email);
        showAlert('Success', 'Allowed email updated successfully!');
      } else {
        await AllowedEmailAPI.create(formData.email);
        showAlert('Success', 'Allowed email added successfully!');
      }
      setModalOpen(false);
      loadAllowedEmails();
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const handleDeleteEmail = (emailItem) => {
    showConfirm('Delete Allowed Email', `Are you sure you want to remove ${emailItem.email} from the allowed list?`, async () => {
      try {
        await AllowedEmailAPI.delete(emailItem.id);
        showAlert('Success', 'Allowed email deleted successfully!');
        loadAllowedEmails();
      } catch (error) {
        showAlert('Error', error.message);
      }
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Allowed Emails</h1>
        <div className="flex gap-2">
          <button
            onClick={loadAllowedEmails}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleAddEmail}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
          >
            + Add Allowed Email
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-8">Loading allowed emails...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated At</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emails.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No allowed emails found
                      </td>
                    </tr>
                  ) : (
                    emails.map((emailItem) => (
                      <tr key={emailItem.id}>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{emailItem.id}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{emailItem.email}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(emailItem.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {emailItem.updated_at ? new Date(emailItem.updated_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEmail(emailItem)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(emailItem)}
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
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmail ? 'Edit Allowed Email' : 'Add Allowed Email'}
      >
        <form onSubmit={handleSaveEmail}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-gray-500">
              Only users with emails in this list will be able to login.
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
          >
            {editingEmail ? 'Update Allowed Email' : 'Add Allowed Email'}
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

export default AllowedEmails;

