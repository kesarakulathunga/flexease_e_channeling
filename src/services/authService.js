// src/services/authService.js
import api from './api';

const authService = {  
  /**
   * Step 1: Check email and send OTP
   * @param {string} email The email address
   * @param {boolean} isResend Whether it's a resend request
   * @returns {Promise<Object>} Response data
   */  
  checkEmail: async (email, isResend = false) => {
    try {
      console.log(`Attempting to send OTP to ${email}${isResend ? ' (resend)' : ''}`);
      const response = await api.post('/auth/check-email', { email, isResend });
      console.log('OTP send successful:', response);
      
      // Map backend field names to what our frontend expects if needed
      return {
        exists: response.emailExists !== undefined ? response.emailExists : response.exists,
        message: response.message || 'OTP sent successfully',
        ...response // Include all other fields as-is
      };
    } catch (error) {
      console.error('Error in checkEmail:', error);
      
      // Detailed error handling based on response type
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response from server:', error.response.data);
        
        // Handle specific error status codes
        if (error.response.status === 400) {
          console.error('Bad request - check input data');
        } else if (error.response.status === 404) {
          console.error('Endpoint not found - check URL');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error - no response received');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
      }
      
      // Check if it's a connection error or server error
      if (error.message && error.message.includes('Network Error')) {
        console.error('Backend connection failed. Make sure your backend is running on port 4000.');
      }
      
      // Rethrow the error for the component to handle
      throw error;
    }
  },  /**
   * Step 2: Verify OTP code
   * @param {string} email The email address
   * @param {string} otpCode The OTP code
   * @returns {Promise<Object>} Response with token, user data, and profiles if any exist
   */    
  verifyOTP: async (email, otpCode) => {
    try {
      console.log(`Verifying OTP for ${email}`);
      const response = await api.post('/auth/verify-email', { 
        email, 
        code: otpCode // Changed from 'otp' to 'code' to match backend expectation
      });
      console.log('OTP verification successful:', response);
      
      // Save auth token to localStorage if provided
      if (response.token) {
        console.log('Setting auth token from OTP verification:', response.token.substring(0, 10) + '...');
        localStorage.setItem('authToken', response.token);
        
        // Store user data if returned
        if (response.user) {
          console.log('Storing user data from OTP verification:', response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Set default role
          localStorage.setItem('userRole', 'PATIENT');
        } else {
          // If no user data but we have email, create a basic user record
          console.log('Creating basic user data from email:', email);
          localStorage.setItem('user', JSON.stringify({ email }));
          localStorage.setItem('userRole', 'PATIENT');
        }
      }
      
      // Transform the response to have a consistent structure
      const transformedResponse = {
        ...response,
        verified: response.verified !== undefined ? response.verified : true,
        hasExistingAccounts: response.hasExistingAccounts !== undefined ? 
                              response.hasExistingAccounts : 
                              !!(response.profiles?.length || response.patients?.length)
      };
      
      // Handle different profile structure formats
      if (response.profiles) {
        transformedResponse.profiles = response.profiles.map(profile => ({
          ...profile,
          id: profile.id || profile._id || profile.patientId
        }));
      } else if (response.patients) {
        transformedResponse.profiles = response.patients.map(patient => ({
          ...patient,
          id: patient.id || patient._id || patient.patientId,
          name: patient.name || patient.fullName
        }));
      }
      
      return transformedResponse;    
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      
      // Enhanced error handling
      if (error.response) {
        // The server responded with a status code outside of 2xx
        console.error('Server error:', error.response.data);
        
        // Display appropriate message based on status code
        if (error.response.status === 400) {
          console.error('Invalid OTP or email format.');
        } else if (error.response.status === 401) {
          console.error('Invalid OTP. Please check and try again.');
        } else if (error.response.status === 404) {
          console.error('Endpoint not found. Please check the API URL.');
        } else {
          console.error(`Server error (${error.response.status})`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error - no response received');
        console.error('Backend connection failed. Make sure your backend is running on port 4000.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
      }
      
      // Rethrow the error for the component to handle
      throw error;
    }
  },    /**
   * Step 3: Select an existing profile from options
   * @param {string} profileId The ID of the selected profile
   * @returns {Promise<Object>} Response with selected profile data
   */  
  selectAccount: async (profileId) => {
    try {      
      console.log(`Selecting profile with ID: ${profileId}`);
      
      // Get the email from localStorage or current user
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : {};
      const email = userData.email;
      
      if (!email) {
        console.error('Email is required for account selection but was not found');
        throw new Error('Email is required for account selection');
      }
      
      // Use the correct endpoint and data structure as required by backend
      console.log('Making select-account request with:', { email, patientId: profileId });
      const response = await api.post('/auth/select-account', { 
        email: email, 
        patientId: profileId 
      });
      
      console.log('Profile selection successful:', response);
      
      // If the response includes a token, store it
      if (response.token) {
        console.log('Setting auth token from profile selection response');
        localStorage.setItem('authToken', response.token);
      }
      
      // Set role to PATIENT
      localStorage.setItem('userRole', 'PATIENT');
        
      // Store the selected profile in localStorage
      if (response.profile) {
        const profile = {
          ...response.profile,
          id: response.profile.id || response.profile._id || response.profile.patientId
        };
        localStorage.setItem('currentProfile', JSON.stringify(profile));
      } else if (response.patient) {
        // Handle alternative response structure
        const profile = {
          ...response.patient,
          id: response.patient.id || response.patient._id || response.patient.patientId,
          name: response.patient.name || response.patient.fullName
        };
        localStorage.setItem('currentProfile', JSON.stringify(profile));
      }
      
      return response;
    } catch (error) {
      console.error('Error in selectAccount:', error);
      
      // Enhanced error handling
      if (error.response) {
        // The server responded with a status code outside of 2xx
        console.error('Server error:', error.response.data);
        
        // Display appropriate message based on status code
        if (error.response.status === 400) {
          console.error('Invalid profile ID or data format.');
        } else if (error.response.status === 401 || error.response.status === 403) {
          console.error('Authentication error. Please verify your email again.');
        } else if (error.response.status === 404) {
          console.error('Profile not found or API endpoint incorrect.');
        } else {
          console.error(`Server error (${error.response.status})`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error - no response received');
        console.error('Backend connection failed. Make sure your backend is running on port 4000.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
      }
      
      // Rethrow the error for the component to handle
      throw error;
    }
  },
  /**
   * Step 3 Alternative: Register a new patient with verified email
   * @param {Object} patientData The patient registration data
   * @returns {Promise<Object>} Response with newly created profile data
   */  
  registerVerifiedPatient: async (patientData) => {
    try {
      console.log('Registering verified patient:', patientData);      // Format the data to match backend expectations
      const formattedData = {
        email: patientData.email,
        fullName: patientData.name,
        age: patientData.age,
        mobileNumber: patientData.mobileNumber,
        verifiedEmail: patientData.email
      };
      console.log('Formatted data for backend:', formattedData);
      
      const response = await api.post('/patients/register-verified', formattedData);
      console.log('Registration successful:', response);
      
      // Make sure the token is set if returned
      if (response.token) {
        console.log('Setting auth token from registration response:', response.token.substring(0, 10) + '...');
        localStorage.setItem('authToken', response.token);
      } else {
        console.warn('No token returned from registration API');
      }
      
      // Make sure the role is set
      localStorage.setItem('userRole', 'PATIENT');
      
      // Make sure user data is set if returned
      if (response.user) {
        console.log('Storing user data from response:', response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        // If no user object, create one with basic info
        console.log('Creating basic user data from patient details');
        const userData = {
          email: patientData.email,
          name: patientData.name
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Store the new profile in localStorage
      if (response.profile) {
        const profile = {
          ...response.profile,
          id: response.profile.id || response.profile._id // Handle different id field names
        };
        console.log('Storing profile from response:', profile);
        localStorage.setItem('currentProfile', JSON.stringify(profile));
      } else if (response.patient) {
        // Handle alternative response structure
        const profile = {
          ...response.patient,
          id: response.patient.id || response.patient._id || response.patient.patientId,
          name: response.patient.name || response.patient.fullName
        };
        console.log('Storing patient profile from response:', profile);
        localStorage.setItem('currentProfile', JSON.stringify(profile));
      } else {
        console.warn('No profile or patient data returned from registration');
      }
      
      // Log final localStorage state after registration
      console.log('Post-registration localStorage state:', {
        authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
        user: localStorage.getItem('user') ? 'User exists' : 'No user',
        currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile',
        userRole: localStorage.getItem('userRole')
      });
      
      return response;
    } catch (error) {
      // Enhanced error handling (existing code kept as is)
      console.error('Error in registerVerifiedPatient:', error);
      // Rethrow the error for the component to handle
      throw error;
    }
  },  /**
   * Send OTP to admin email
   * @param {string} email Admin email address
   * @param {boolean} isResend Whether it's a resend request
   * @returns {Promise<Object>} Response data
   */
  sendAdminOtp: async (email, isResend = false) => {
    try {
      console.log(`Sending admin OTP to ${email}${isResend ? ' (resend)' : ''}`);
      const response = await api.post('/admin-auth/check-admin-email', { email, isResend });
      console.log('Admin OTP send successful:', response);
      
      return {
        emailExists: response.emailExists !== undefined ? response.emailExists : true,
        isAdmin: response.isAdmin !== undefined ? response.isAdmin : true,
        admin: response.admin || null,
        message: response.message || 'OTP sent successfully',
        ...response // Include all other fields as-is
      };
    } catch (error) {
      console.error('Error in sendAdminOtp:', error);
      
      // If the email doesn't belong to an admin
      if (error.response && error.response.status === 404) {
        throw new Error('Email not registered as admin');
      }
      
      throw error;
    }
  },
  
  /**
   * Admin login with OTP
   * @param {string} email Admin email
   * @param {string} otp OTP code
   * @returns {Promise<Object>} Response with token and admin data
   */
  adminLogin: async (email, otp) => {
    try {
      console.log(`Verifying admin OTP for ${email}`);
      const response = await api.post('/admin-auth/verify-admin-otp', { 
        email, 
        code: otp // Use 'code' instead of 'otp' to match backend
      });
      console.log('Admin login response:', response);
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('userRole', response.role || 'ADMIN');
        
        if (response.admin) {
          localStorage.setItem('user', JSON.stringify(response.admin));
        } else {
          // If no admin data returned, create a basic user object
          const adminUser = { email, role: 'ADMIN' };
          localStorage.setItem('user', JSON.stringify(adminUser));
        }
      }
      
      return {
        data: response.admin || { email },
        token: response.token,
        message: response.message || 'Admin authenticated successfully'
      };
    } catch (error) {
      console.error('Error in adminLogin:', error);
      
      // If OTP verification failed
      if (error.response && error.response.status === 400) {
        throw new Error('Invalid OTP code');
      }
      
      throw error;
    }
  },/**
   * Logout the current user
   * @param {Object} options Optional parameters for logout
   * @param {boolean} options.redirect Whether to redirect after logout
   * @param {string} options.redirectUrl URL to redirect to after logout
   * @returns {Promise<void>}
   */  logout: async (options = {}) => {
    console.log('Logging out user with options:', options);
    try {
      // Set a flag to prevent API interceptor from redirecting 
      // if we get an authentication error during logout
      window.isPerformingLogout = true;
      
      // Log all items before clearing
      console.log('Pre-logout localStorage state:', {
        authToken: localStorage.getItem('authToken'),
        user: localStorage.getItem('user'),
        isAdmin: localStorage.getItem('isAdmin'),
        userRole: localStorage.getItem('userRole'),
        currentProfile: localStorage.getItem('currentProfile')
      });
      
      // Clear all auth-related items from localStorage first
      // This ensures even if the API call fails, we're still logged out locally
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentProfile');
      
      // Now try the API call - if it fails, we've already cleaned up locally
      // Use the appropriate endpoint based on user role
      const isAdmin = options.isAdmin || localStorage.getItem('isAdmin') === 'true';
      
      try {
        if (isAdmin) {
          await api.post('/admin-auth/admin-logout');
          console.log('Admin logout completed');
        } else {
          await api.post('/auth/logout');
          console.log('Patient logout completed');
        }
      } catch (error) {
        console.warn('Logout API call failed, but local logout completed:', error.message);
      }
      
      console.log('Logout completed, localStorage cleared');
      
      // Always redirect to home page for consistent UX
      if (options.redirect) {
        console.log(`Redirecting to ${options.redirectUrl || '/'}`);
        window.location.href = options.redirectUrl || '/';
      }
    } catch (error) {
      console.error('Error during logout API call:', error);
      // Continue with local logout even if API call fails
      
      // If redirect was requested but the API call failed,
      // still perform the redirect
      if (options.redirect) {
        console.log(`Redirecting to ${options.redirectUrl || '/'} despite API error`);
        window.location.href = options.redirectUrl || '/';
      }
    } finally {
      // Clear the flag
      window.isPerformingLogout = false;
    }
  },

  /**
   * Get the current authenticated user
   * @returns {Object|null} The user object or null
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },    /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    console.log('authService.isAuthenticated check:', token ? 'Token exists' : 'No token found');
    
    // Additional check: Also verify that user data exists
    const user = localStorage.getItem('user');
    
    // Log all auth-related data for debugging
    console.log('Auth state check:', {
      hasToken: !!token,
      hasUser: !!user,
      userRole: localStorage.getItem('userRole'),
      isAdmin: localStorage.getItem('isAdmin')
    });
    
    // If we have a token but no user data, create a basic user record
    if (token && !user) {
      console.log('Token exists but no user data found - creating basic user data');
      localStorage.setItem('user', JSON.stringify({ email: 'user@example.com' }));
      
      // Ensure we have a role set
      if (!localStorage.getItem('userRole')) {
        localStorage.setItem('userRole', 'PATIENT');
      }
    }
    
    // Return true if token exists
    return !!token;
  },

  /**
   * Check if user is an admin
   * @returns {boolean} True if admin
   */
  isAdmin: () => {
    return localStorage.getItem('isAdmin') === 'true';
  }
};

export default authService;
