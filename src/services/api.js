// src/services/api.js
import axios from 'axios';

// Create an axios instance with common configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global flag to track logout operations to prevent unwanted redirects
window.isPerformingLogout = false;

// Cache for API endpoint patterns that work
window.endpointPatternCache = window.endpointPatternCache || {
  updateProfile: null, // Will be 'me', 'id', or 'profiles' based on what works
};

/**
 * Validates if a JWT token is properly formatted
 * @param {string} token The JWT token to validate
 * @returns {boolean} True if the token appears to be valid, false otherwise
 */
api.isValidToken = (token) => {
  if (!token) return false;

  // Basic format check: JWT tokens should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('Invalid token format: Token does not have 3 parts');
    return false;
  }

  // Check if each part is base64 encoded
  try {
    // Try to decode each part (header and payload)
    atob(parts[0]);
    atob(parts[1]);
    // Signature might not be valid base64, so we don't check it

    return true;
  } catch (e) {
    console.error('Invalid token format: Parts are not properly base64 encoded', e);
    return false;
  }
};

/**
 * Gets the current auth token and validates its format
 * @returns {string|null} The token if valid, null otherwise
 */
api.getValidToken = () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.warn('No auth token found in localStorage');
    return null;
  }

  if (!api.isValidToken(token)) {
    console.error('Invalid token format found in localStorage');
    // Clear the invalid token
    localStorage.removeItem('authToken');
    return null;
  }

  return token;
};

// Helper function to detect which API endpoint pattern works for a specific operation
api.detectEndpoint = async (operation, patterns, id = null, data = {}) => {
  const cache = window.endpointPatternCache || {};

  if (cache[operation]) {
    console.log(`Using cached endpoint pattern for ${operation}: ${cache[operation]}`);
    return cache[operation];
  }

  console.log(`Detecting available endpoint for ${operation}...`);

  // For update operations, we can't easily test with HEAD/GET because
  // the server might require authentication, and HEAD might not be supported
  // So we'll just use the first pattern for now, and it will be updated
  // once a successful operation is performed
  if (operation.startsWith('update')) {
    console.log(`Using first pattern for ${operation} without testing: ${patterns[0]}`);
    window.endpointPatternCache = window.endpointPatternCache || {};
    window.endpointPatternCache[operation] = patterns[0];
    return patterns[0];
  }

  // Try each pattern in sequence
  for (const pattern of patterns) {
    try {
      let endpoint;
      switch (pattern) {
        case 'me':
          endpoint = '/patients/me';
          break;
        case 'id':
          endpoint = `/patients/${id}`;
          break;
        case 'profiles':
          endpoint = `/patients/profiles/${id}`;
          break;
        default:
          endpoint = pattern.replace(':id', id);
      }

      console.log(`Testing endpoint pattern ${pattern}: ${endpoint}`);
      // Make a small request to see if the endpoint works
      await api.get(endpoint);
        // If we get here, the endpoint works
      console.log(`Endpoint pattern ${pattern} works for ${operation}`);
      window.endpointPatternCache = window.endpointPatternCache || {};
      window.endpointPatternCache[operation] = pattern;
      return pattern;
    } catch (error) {
      console.log(`Endpoint pattern ${pattern} failed for ${operation}:`, error.message);
      // Continue to the next pattern
    }
  }

  // If we get here, no pattern worked - use the first one as default
  console.warn(`No endpoint pattern worked for ${operation}, defaulting to ${patterns[0]}`);
  window.endpointPatternCache = window.endpointPatternCache || {};
  window.endpointPatternCache[operation] = patterns[0];
  return patterns[0];
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Skip token validation if Authorization header is already set (for explicit calls)
    if (config.headers['Authorization']) {
      console.log(`API Request: Using provided Authorization header for ${config.url}`);
      return config;
    }

    // Get and validate the token
    const token = api.getValidToken();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (token) {
      console.log(`API Request: Adding validated token to ${config.url}`);
      config.headers['Authorization'] = `Bearer ${token}`;

      // For debugging, log current auth state with each request
      console.log('Current auth state:', {
        token: token ? 'Bearer ' + token.substring(0, 10) + '...' : 'No token',
        tokenFormat: token ? (token.split('.').length === 3 ? 'Valid JWT format' : 'Invalid format') : 'No token',
        url: config.url,
        method: config.method,
        userRole: localStorage.getItem('userRole'),
        isAdmin: isAdmin
      });
    } else {
      console.log(`API Request: No valid token available for ${config.url}`);

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
      const { status, data } = error.response;
      const requestUrl = error.config?.url || 'unknown endpoint';
      console.error(`API Error Response: ${status} for ${requestUrl}`, data);

      // If unauthorized or token expired
      if (status === 401 || status === 403) {
        // Only log auth errors for admin paths if it's an admin token
        const isAdminPath = requestUrl.includes('/admin/');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        if (isAdminPath) {
          if (isAdmin) {
            console.error('Admin authentication failed for admin endpoint:', requestUrl);
          } else {
            console.error('Non-admin token used for admin endpoint:', requestUrl);
          }
        } else {
          console.error('Authentication failed. Clearing auth data.');
        }

        // Log current localStorage state
        console.log('Pre-cleanup localStorage:', {
          authToken: localStorage.getItem('authToken') ? 'Token exists' : 'No token',
          user: localStorage.getItem('user') ? 'User exists' : 'No user',
          userRole: localStorage.getItem('userRole'),
          isAdmin: localStorage.getItem('isAdmin'),
          currentProfile: localStorage.getItem('currentProfile') ? 'Profile exists' : 'No profile'
        });
          // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentProfile');
        localStorage.removeItem('isAdmin');        // Redirect to login page if needed        // Skip redirect if:
        // 1. Already on the home page
        // 2. On a dashboard page (which includes profile deletion)
        // 3. Explicitly performing a logout operation
        // 4. Current URL includes 'logout' path segment
        if (window.location.pathname !== '/' &&
            !window.location.pathname.includes('/dashboard') &&
            !window.location.pathname.includes('/logout') &&
            !window.isPerformingLogout) {
          console.log('Authentication expired. Redirecting to home page.');

          // Use setTimeout to allow the current execution to complete
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        } else {
          console.log('Not redirecting: Currently on excluded page or performing logout operation.');
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
