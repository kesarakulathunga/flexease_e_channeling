import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services';
import './DeleteProfile.css';

export default function DeleteProfile() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState(null);

  // Check available endpoints on component mount
  useEffect(() => {
    const checkEndpoints = async () => {
      try {
        const result = await adminService.testAdminEndpoints();
        setEndpointStatus(result);
        if (!result.success || !result.recommendedEndpoint) {
          console.warn('No suitable admin endpoints found. Profile deletion may not work.');
        } else {
          console.log('Found suitable admin endpoint:', result.recommendedEndpoint);
        }
      } catch (err) {
        console.error('Error checking admin endpoints:', err);
      }
    };
    
    checkEndpoints();
  }, []);  const handleSelfDelete = () => {
    setShowConfirmation(true);
    setError('');
  };

  const handleConfirmSelfDelete = async () => {
    setIsDeleting(true);
    setError('');
    // Check token before deletion
    const token = localStorage.getItem('authToken');
    console.log('Delete profile - Token check:', token ? 'Token exists' : 'No token found');
    console.log('Delete profile - Auth state:', {
      isAdmin: localStorage.getItem('isAdmin'),
      userRole: localStorage.getItem('userRole')
    });
    
    if (!token) {
      setError('Authentication error: No token found. Please log in again.');
      setIsDeleting(false);
      return;
    }
    
    try {
      if (endpointStatus?.recommendedEndpoint) {
        console.log(`Using recommended endpoint: ${endpointStatus.recommendedEndpoint}`);
        // Try the recommended endpoint directly using axios
        await adminService.deleteAdminProfileWithEndpoint(endpointStatus.recommendedEndpoint);
      } else {
        // Fall back to default implementation
        await adminService.deleteAdminProfile();
      }
      
      console.log('Profile deleted successfully, redirecting to home page');
      // Redirect to home page after successful deletion
      navigate('/');
    } catch (err) {
      console.error('Error deleting admin profile:', err);
      
      // Try alternative endpoints if we got a 404
      if (err.response?.status === 404 && !endpointStatus?.recommendedEndpoint) {
        try {
          console.log('First attempt failed with 404, trying alternative endpoints...');
          
          // Try testing endpoints first
          const testResult = await adminService.testAdminEndpoints();
          setEndpointStatus(testResult);
          
          if (testResult.recommendedEndpoint) {
            console.log(`Retrying with alternative endpoint: ${testResult.recommendedEndpoint}`);
            await adminService.deleteAdminProfileWithEndpoint(testResult.recommendedEndpoint);
            console.log('Profile deleted successfully with alternative endpoint, redirecting to home page');
            navigate('/');
            return;
          }
        } catch (retryErr) {
          console.error('Error with alternative endpoints:', retryErr);
        }
      }
      
      // Detailed error handling
      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          setError('Authentication error: ' + (err.response.data?.message || 'Not authorized'));
        } else if (status === 404) {
          setError('Profile not found. The API endpoint may be incorrect (tried: /admin/me)');
        } else {
          setError(`Error (${status}): ${err.response.data?.message || 'Failed to delete profile'}`);
        }
      } else if (err.request) {
        setError('Network error: Server not responding. Please try again later.');
      } else {
        setError('Failed to delete profile: ' + (err.message || 'Unknown error'));
      }
      
      setIsDeleting(false);
    }
  };
  
  const handleEmailSubmit = () => {
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Show confirmation dialog
    setError('');
    setShowConfirmation(true);
  };
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError('');
    setSuccessMessage('');
    
    // Check token before deletion
    const token = localStorage.getItem('authToken');
    console.log('Delete user profile - Token check:', token ? 'Token exists' : 'No token found');
    console.log('Delete user profile - Auth state:', {
      isAdmin: localStorage.getItem('isAdmin'),
      userRole: localStorage.getItem('userRole'),
      email: email
    });
    
    if (!token) {
      setError('Authentication error: No token found. Please log in again.');
      setIsDeleting(false);
      return;
    }
    
    try {
      await adminService.deleteUserProfile(email);
      setSuccessMessage(`Profile for ${email} was successfully deleted.`);
      setEmail('');
      setShowConfirmation(false);
    } catch (err) {
      console.error('Error deleting user profile:', err);
      if (err.response?.status === 403) {
        setError('You cannot delete your own profile from here. Use the "Delete My Profile" option instead.');
      } else if (err.response?.status === 404) {
        setError('User profile not found.');
      } else if (err.response?.status === 401) {
        setError('Authentication error: Your session may have expired. Please log in again.');
      } else {
        setError('Failed to delete profile: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to dashboard
    navigate('/admin/dashboard');
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="admin-delete-profile">
      <h2>Profile Management</h2>

      {/* Delete user profile by email */}
      <div className="profile-section">
        <h3>Delete User Profile</h3>
        {!showConfirmation ? (
          <>
            <div className="email-input-group">
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDeleting}
              />
              <button 
                className="search-button"
                onClick={handleEmailSubmit}
                disabled={isDeleting || !email}
              >
                Search
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
          </>
        ) : (
          <div className="confirmation-box">
            <p className="warning-text">Are you sure you want to delete the profile for:</p>
            <p className="email-display">{email}</p>
            <p className="sub-text">This action cannot be undone and will remove all user data.</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="button-group">
              <button 
                className="cancel-button" 
                onClick={handleCancelConfirmation}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-button" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Separator */}
      <div className="separator"></div>
        {/* Delete own admin profile */}
      <div className="profile-section">
        <h3>Delete My Profile</h3>
        <p className="sub-text">Delete your admin account. This action cannot be undone.</p>
        
        {!showConfirmation ? (
          <button 
            className="self-delete-button" 
            onClick={handleSelfDelete}
            disabled={isDeleting}
          >
            Delete My Admin Account
          </button>
        ) : (
          <div className="self-delete-confirmation">
            <div className="confirmation-content">
              <span className="warning-icon">⚠️</span>
              <h4>Delete Admin Account</h4>
              <p className="warning-text">This action cannot be reversed!</p>
              <p className="confirmation-message">
                Are you sure you want to delete your admin account? This will:
              </p>
              <ul className="consequences-list">
                <li>Remove all your admin privileges</li>
                <li>Delete your admin profile permanently</li>
                <li>Log you out immediately</li>
                <li>Redirect you to the home page</li>
              </ul>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="confirmation-buttons">
                <button 
                  className="cancel-button" 
                  onClick={handleCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-delete-button" 
                  onClick={handleConfirmSelfDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner"></span>
                      Deleting...
                    </>
                  ) : (
                    'Confirm Deletion'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}