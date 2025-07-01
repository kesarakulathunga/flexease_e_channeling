import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './LogoutPage.css';

export default function LogoutPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');
  
  // Force redirect to home after successful logout
  useEffect(() => {
    return () => {
      // If component unmounts while logging out, ensure we go home
      if (isLoggingOut) {
        window.location.href = '/';
      }
    };  }, [isLoggingOut]);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError('');
    
    try {
      console.log('LogoutPage - Starting logout process');
      
      // Set a flag to prevent API interceptor from redirecting
      window.isPerformingLogout = true;
      
      // Call context logout with explicit redirect instruction
      await logout({
        redirect: true,
        redirectUrl: '/'
      });
      
      // Clear all auth-related storage directly to ensure clean state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentProfile');
      localStorage.removeItem('isAdmin');
      
      // Force redirect to home page using multiple methods for reliability
      window.location.href = '/';
      
      // The redirect should happen immediately, but add a fallback
      setTimeout(() => {
        if (document.location.pathname !== '/') {
          console.log('LogoutPage - Fallback redirect to home page');
          window.location.href = '/';
        }
      }, 500);
    } catch (err) {
      console.error('LogoutPage - Logout error:', err);
      setError('Failed to log out. Please try again.');
      setIsLoggingOut(false);
      
      // Reset the flag if logout fails
      window.isPerformingLogout = false;
    }
  };
  
  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="logout-page">
      <h2>Log Out</h2>
      <p>Are you sure you want to log out?</p>
      
      {error && <div className="error">{error}</div>}
      
      <div className="actions">
        <button 
          className="btn-logout-cancel" 
          onClick={handleCancel}
          disabled={isLoggingOut}
        >
          Cancel
        </button>
        <button 
          className="btn-logout-confirm" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging Out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}
