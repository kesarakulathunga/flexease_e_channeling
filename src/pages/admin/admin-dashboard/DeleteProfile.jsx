import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DeleteProfile.css';

export default function DeleteProfile() {
  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    // TODO: Implement actual profile deletion logic here
    console.log('Profile deletion confirmed');
    // Redirect to login page after deletion
    navigate('/admin/login');
  };

  const handleCancel = () => {
    // Navigate back to dashboard
    navigate('/admin/dashboard');
  };

  return (
    <div className="admin-delete-profile">
      <h2>Delete Profile</h2>
      <div className="delete-content">
        <p className="warning-text">Are you sure you want to delete your admin profile?</p>
        <p className="sub-text">This action cannot be undone.</p>
        
        <div className="button-group">
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button className="delete-button" onClick={handleConfirmDelete}>
            Delete Profile
          </button>
        </div>
      </div>
    </div>
  );
}