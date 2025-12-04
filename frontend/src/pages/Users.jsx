import React, { useState, useEffect } from 'react';
import { UsersAPI, AllowedEmailAPI } from '../services/api';
import { getUser } from '../services/api';
import { Modal, AlertModal, ConfirmModal } from '../components/Modal';
import { AdminAuthAPI } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', registration_ip: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await UsersAPI.getAll();
      setUsers(data.users || []);
    } catch (error) {
      showAlert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
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

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      registration_ip: user.registration_ip || '',
    });
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await UsersAPI.update(editingUser.id, formData.name, formData.email, formData.registration_ip || null);
        showAlert('Success', 'User updated successfully!');
      } else {
        if (formData.password !== formData.confirmPassword) {
          showAlert('Error', 'Passwords do not match');
          return;
        }
        await AdminAuthAPI.register(
          formData.name,
          formData.email,
          formData.password,
          formData.confirmPassword
        );
        showAlert('Success', 'User added successfully!');
      }
      setModalOpen(false);
      loadUsers();
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const handleToggleBlock = async (user, blocked) => {
    const currentUser = getUser();
    if (currentUser && (currentUser.id === user.id || currentUser.email === user.email)) {
      showAlert('Action Not Allowed', 'You cannot block or unblock yourself!');
      return;
    }

    showConfirm(
      'Confirm Action',
      `Are you sure you want to ${blocked === 0 ? 'block' : 'unblock'} this user?`,
      async () => {
        try {
          await UsersAPI.toggleBlock(user.id, blocked);
          showAlert('Success', `User ${blocked === 0 ? 'blocked' : 'unblocked'} successfully!`);
          loadUsers();
        } catch (error) {
          showAlert('Error', error.message);
        }
      }
    );
  };

  const handleDeleteUser = async (user) => {
    const currentUser = getUser();
    if (currentUser && (currentUser.id === user.id || currentUser.email === user.email)) {
      showAlert('Action Not Allowed', 'You cannot delete yourself!');
      return;
    }

    showConfirm('Confirm Delete', 'Are you sure you want to delete this user?', async () => {
      try {
        await UsersAPI.delete(user.id);
        showAlert('Success', 'User deleted successfully!');
        loadUsers();
      } catch (error) {
        showAlert('Error', error.message);
      }
    });
  };

  const handleAllowEmail = async (user) => {
    try {
      await AllowedEmailAPI.create(user.email);
      showAlert('Success', `Email ${user.email} added to allowed list successfully!`);
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const currentUser = getUser();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={handleAddUser}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isCurrentUser = currentUser && (user.id === currentUser.id || user.email === currentUser.email);
                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">You</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.registration_ip || <em>Not set</em>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              user.blocked === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.blocked === 1 ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleAllowEmail(user)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Allow Email
                            </button>
                            <button
                              onClick={() => handleToggleBlock(user, user.blocked === 1 ? 0 : 1)}
                              disabled={isCurrentUser}
                              className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isCurrentUser ? 'You cannot block yourself' : ''}
                            >
                              {user.blocked === 1 ? 'Block' : 'Unblock'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isCurrentUser}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isCurrentUser ? 'You cannot delete yourself' : ''}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSaveUser}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {!editingUser && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword || ''}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}
          {editingUser && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration IP</label>
              <input
                type="text"
                value={formData.registration_ip}
                onChange={(e) => setFormData({ ...formData, registration_ip: e.target.value })}
                placeholder="192.168.1.100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <small className="text-gray-500">Leave empty to allow login from any IP</small>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
          >
            {editingUser ? 'Update User' : 'Add User'}
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

export default Users;
