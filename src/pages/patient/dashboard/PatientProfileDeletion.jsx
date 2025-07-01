// src/pages/patient/dashboard/PatientProfileDeletion.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext'; // Your auth context
import { profileService } from '../../../services';
import './PatientProfileDeletion.css'; // We'll create this file next

function PatientProfileDeletion() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  const handleOpenConfirm = () => {
    setIsConfirmOpen(true);
    setConfirmText('');
    setError(null);
    setStatus('');
    setProgress(0);
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== 'DELETE') return;

    setIsLoading(true);
    setError(null);
    setStatus('Starting deletion process...');
    setProgress(10);

    try {
      // Get the patient ID from the user object
      const patientId = user.patientId;

      if (!patientId) {
        throw new Error('Patient ID not found. Please try again or contact support.');
      }

      // Step 1: Delete all appointments using the new API endpoint
      setStatus('Deleting all appointments...');
      setProgress(20);
      try {
        // Call the new API endpoint to delete all appointments
        const appointmentsResult = await profileService.deleteAllPatientAppointments(patientId);
        console.log('Appointments deletion result:', appointmentsResult);
        setStatus(`Successfully deleted ${appointmentsResult.count || 0} appointments`);
        setProgress(30);

        // Add a 5-second delay before proceeding with profile deletion
        setStatus('Processing deletion request...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        setProgress(50);
      } catch (appointmentErr) {
        console.error('Error deleting appointments:', appointmentErr);
        setStatus('Warning: Could not delete all appointments, but continuing...');

        // Add a 5-second delay even if there was an error
        await new Promise(resolve => setTimeout(resolve, 5000));
        setProgress(40);
        // Continue with profile deletion even if appointment deletion fails
      }

      // Step 2: Call the profile service to delete the patient profile
      setStatus('Deleting profile...');
      setProgress(70);
      await profileService.deletePatientProfile(patientId);

      setStatus('Profile successfully deleted!');
      setProgress(100);

      // Show success message before redirecting
      // Don't redirect until the entire process is complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log out the user
      logout();

      // Redirect to home page
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to delete profile');
      setStatus('Error occurred during deletion');
      setProgress(0);
      setIsLoading(false);
    }
  };

  return (
    <div className="danger-zone">
      <h3>Delete Your Profile</h3>
      <p>
        This action will permanently delete your profile and all associated data,
        including appointments, reports, and personal information.
      </p>
      <button
        className="delete-button"
        onClick={handleOpenConfirm}
      >
        Delete My Profile
      </button>

      {isConfirmOpen && (
        <div className="confirm-dialog">
          <h4>Are you sure?</h4>
          <p>This action cannot be undone. All your data will be permanently deleted.</p>
          <p>To confirm, type "DELETE" in the field below:</p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
          />

          {error && <p className="error-message">{error}</p>}

          {isLoading && status && (
            <div className="status-container">
              <p className="status-message">{status}</p>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="dialog-actions">
            <button
              onClick={handleCloseConfirm}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={confirmText !== 'DELETE' || isLoading}
              className="confirm-delete-button"
            >
              {isLoading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientProfileDeletion;
