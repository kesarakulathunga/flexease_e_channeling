// src/services/api.js
import axios from 'axios';

// Create an axios instance with common configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');    if (token) {
      console.log(`API Request: Adding token to ${config.url}`);
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // For debugging, log current auth state with each request
      console.log('Current auth state:', {
        token: 'Bearer ' + token.substring(0, 10) + '...',
        url: config.url,
        method: config.method,
        userRole: localStorage.getItem('userRole')
      });
    } else {
      console.log(`API Request: No token available for ${config.url}`);
      
      // For non-auth endpoints, check if we need to include any identification
      if (!config.url.includes('/auth/') && !config.url.includes('/login')) {
        console.warn('Making unauthenticated request to protected endpoint:', config.url);
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle specific error status codes
    if (error.response) {
      const { status } = error.response;
      console.error(`API Error Response: ${status}`, error.response.data);
      
      // If unauthorized or token expired
      if (status === 401 || status === 403) {
        console.error('Authentication failed. Clearing auth data.');
        
        // Log current localStorage state
        console.log('Pre-cleanup localStorage:', {
          authToken: localStorage.getItem('authToken'),
          user: localStorage.getItem('user'),
          userRole: localStorage.getItem('userRole'),
          isAdmin: localStorage.getItem('isAdmin'),
          currentProfile: localStorage.getItem('currentProfile')
        });
        
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentProfile');
        localStorage.removeItem('isAdmin');
          // Redirect to login page if needed
        if (window.location.pathname !== '/' && 
            !window.location.pathname.includes('/verify-email')) {
          console.log('Authentication expired. Redirecting to email verification page.');
          
          // Use setTimeout to allow the current execution to complete
          setTimeout(() => {
            window.location.href = '/verify-email';
          }, 100);
        }
      }
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('Error setting up API request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
