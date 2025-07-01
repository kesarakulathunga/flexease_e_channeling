import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services';
import './Logout.css';

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setError('');
    
    try {
      // Set the flag to prevent redirection
      window.isPerformingLogout = true;
      
      // Call logout with redirect options and isAdmin flag
      await logout({
        redirect: true,
        redirectUrl: '/',
        isAdmin: true
      });
      
      // Make sure all auth-related items are cleared
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentProfile');
      
      // Force redirect to home page
      window.location.href = '/';
      
      // Fallback redirect if needed
      setTimeout(() => {
        if (document.location.pathname !== '/') {
          console.log('Admin Logout - Fallback redirect to home page');
          window.location.href = '/';
        }
      }, 500);
    } catch (err) {
      console.error('Admin logout error:', err);
      setError('Failed to log out. Please try again.');
      setIsLoggingOut(false);
      
      // Reset the flag if logout fails
      window.isPerformingLogout = false;
    }
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="logout-page">
      <h2>Log Out</h2>
      <div className="logout-content">
        <p className="warning-text">Are you sure you want to log out?</p>
        
        {error && <div className="error">{error}</div>}
        
        <div className="button-group">
          <button 
            className="cancel-button" 
            onClick={handleCancel}
            disabled={isLoggingOut}
          >
            Cancel
          </button>
          <button 
            className="logout-button" 
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
}