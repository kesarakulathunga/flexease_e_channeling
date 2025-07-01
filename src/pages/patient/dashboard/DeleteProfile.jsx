import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { patientService } from '../../../services';
import './DeleteProfile.css';

export default function DeleteProfile() {
  const nav = useNavigate();
  const { currentProfile, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  const cancel = () => nav('/dashboard');

  const showFinalWarning = () => {
    setShowConfirmation(false);
    setShowFinalConfirmation(true);
  };
  const confirm = async () => {
    if (!currentProfile?.id) {
      setError('No profile ID found. Cannot delete profile.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      console.log('Attempting to delete profile with ID:', currentProfile.id);

      // Immediately set up a backup to ensure we redirect to home
      // This will run if anything goes wrong with the API or if interrupted
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout triggered - ensuring redirect to home');
        logout();
        nav('/');
      }, 10000); // Extended timeout to accommodate the new API call and delay

      // Step 1: First delete all appointments using the new API endpoint
      try {
        console.log('Deleting all appointments first...');
        const { profileService } = await import('../../../services');
        const appointmentsResult = await profileService.deleteAllPatientAppointments(currentProfile.id);
        console.log('Appointments deletion result:', appointmentsResult);

        // Wait for 5 seconds before proceeding with profile deletion
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (appointmentErr) {
        console.error('Error deleting appointments:', appointmentErr);
        console.log('Continuing with profile deletion despite appointment deletion error');

        // Still wait 5 seconds before proceeding
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Step 2: Call the patientService to delete the profile
      await patientService.deleteProfile(currentProfile.id);

      console.log('Profile deletion successful');

      // Clear the safety timeout since the operation succeeded
      clearTimeout(safetyTimeout);

      // Perform logout to clear all auth data
      await logout();

      // Always navigate to home page immediately to prevent any redirects
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting profile:', err);

      // For ANY error, just perform a client-side logout and redirect to home
      console.log('Error occurred during deletion, performing client-side cleanup anyway');

      // Set error for user feedback
      setError(`Note: ${err.message || 'An error occurred'} - but your profile has been deleted from this device.`);

      // Complete the action anyway with a small delay to show the message
      setTimeout(() => {
        logout();
        // Force navigation to home with window.location to bypass React Router
        // This ensures we don't get caught in any redirection middleware
        window.location.href = '/';
      }, 2000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="delete-profile">
      <h2>Delete Profile</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showConfirmation && (
        <>
          <p>Are you sure you want to delete your profile?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="actions">
            <button className="btn-delete-cancel" onClick={cancel} disabled={isDeleting}>Cancel</button>
            <button className="btn-delete-confirm" onClick={showFinalWarning} disabled={isDeleting}>Continue</button>
          </div>
        </>
      )}

      {showFinalConfirmation && (
        <>
          <p className="warning-text">Final Warning!</p>
          <p>Deleting your profile will:</p>
          <ul className="warning-list">
            <li>Remove all your personal information</li>
            <li>Cancel all pending appointments</li>
            <li>Delete your medical records</li>
            <li>Log you out of the system</li>
          </ul>
          <p>This action <strong>cannot be reversed</strong>. Are you absolutely sure?</p>
          <div className="actions">
            <button className="btn-delete-cancel" onClick={cancel} disabled={isDeleting}>Cancel</button>
            <button
              className="btn-delete-confirm"
              onClick={confirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete My Profile'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
