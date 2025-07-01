import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services';
import './ViewAdmins.css';

export default function ViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    email: ''
  });

  // Load existing admins
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Loading admins...');
      const admins = await adminService.getAdmins();
      console.log('Admins loaded:', admins);

      if (Array.isArray(admins)) {
        setAdmins(admins);
        setError(''); // Clear any previous error since we have data
      } else {
        console.warn('Unexpected admins format:', admins);
        setError('Failed to load admin list properly');
        setAdmins([]);
      }
    } catch (err) {
      console.error('Error loading admins:', err);

      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          setError('Authentication error. Please try logging in again.');
        } else if (status === 404) {
          setError('Admin list endpoint not found. Please contact support.');
        } else {
          setError(`Server error (${status}): ${err.response.data?.message || 'Failed to load admins'}`);
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load admins. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    // Validate email format
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Check for duplicate in current list
    if (admins.some(a => a.email === newEmail)) {
      setError('That email is already an admin.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await adminService.addAdmin(newEmail);

      if (response.success) {
        await loadAdmins(); // Refresh the list to ensure consistency
        setNewEmail(''); // Clear input field
        setSuccessMessage(response.message || `${newEmail} was successfully added as an admin.`);
      } else {
        throw new Error(response.message || 'Failed to add admin');
      }
    } catch (err) {
      console.error('Error adding admin:', err);
      setError(err.message || 'Failed to add admin. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showRemoveConfirmation = (email) => {
    setConfirmModal({
      show: true,
      email: email
    });
  };

  const hideRemoveConfirmation = () => {
    setConfirmModal({
      show: false,
      email: ''
    });
  };

  const handleRemove = async (email) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await adminService.removeAdmin(email);

      if (response.success) {
        setAdmins(admins.filter(a => a.email !== email));
        setSuccessMessage(response.message || `${email} was successfully removed as an admin.`);
      } else {
        throw new Error(response.message || 'Failed to remove admin');
      }
    } catch (err) {
      console.error('Error removing admin:', err);

      // Use the error message from the service if available
      setError(err.message || 'Failed to remove admin. Please try again.');

      // Refresh the list to ensure we're in sync with the server
      await loadAdmins();
    } finally {
      setIsSubmitting(false);
      hideRemoveConfirmation();
    }
  };

  return (
    <div className="view-admins-page">
      <h2>Manage Admins</h2>

      {/* Add admin form */}
      <div className="view-admin-form">
        <input
          type="email"
          placeholder="admin@example.com"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          onClick={handleAdd}
          disabled={isSubmitting || !newEmail.trim()}
        >
          {isSubmitting ? 'Adding...' : 'Add Admin'}
        </button>
      </div>

      {/* Error and success messages */}
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Admin list */}
      <h3>Current Admins</h3>
      {isLoading ? (
        <div className="loading">Loading admins...</div>
      ) : admins.length === 0 ? (
        <p className="no-data">No admins found.</p>
      ) : (
        <ul className="admin-list">
          {admins.map(({ email }) => (
            <li key={email}>
              <span className="admin-email">{email}</span>
              <button
                onClick={() => showRemoveConfirmation(email)}
                disabled={isSubmitting}
                className="remove-button"
              >
                {isSubmitting ? 'Removing...' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Remove Admin</h3>
            </div>
            <div className="modal-body">
              <p className="warning-text">Are you sure you want to remove {confirmModal.email} as an admin?</p>
              <p className="sub-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={hideRemoveConfirmation}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="delete-button"
                onClick={() => handleRemove(confirmModal.email)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removing...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
