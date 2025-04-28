import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

export default function Logout() {
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    // Clear user session/token here (e.g., localStorage.removeItem('adminToken'))
    console.log('Admin logging out...');
    navigate('/admin/login');
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="logout-page">
      <h2>Log Out</h2>
      <div className="logout-content">
        <p className="warning-text">Are you sure you want to log out?</p>
        <div className="button-group">
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button className="logout-button" onClick={handleConfirmLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}