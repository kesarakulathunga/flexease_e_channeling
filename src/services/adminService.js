// src/services/adminService.js
import api from './api';

const adminService = {
  /**
   * Get all admin users
   * @returns {Promise<Array>} List of admin users with email property
   */
  getAdmins: async () => {
    try {
      const response = await api.get('/admin/users');
      console.log('Admin users response:', response);

      if (Array.isArray(response)) {
        return response;
      }

      if (response && typeof response === 'object') {
        // Check for data in common response formats
        const adminList = response.admins || response.users || response.data;
        if (Array.isArray(adminList)) {
          return adminList;
        }
      }

      console.error('Unexpected admin response format:', response);
      throw new Error('Could not process admin list from server');
    } catch (error) {
      console.error('Error fetching admins:', error);

      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }

      // Specific error handling based on status
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Session expired. Please log in again.');
      }
      if (error.response.status === 404) {
        throw new Error('Admin API not found. Please contact support.');
      }

      throw new Error(error.response.data?.message || 'Failed to load admin list');
    }
  },

  /**
   * Add a new admin by email
   * @param {string} email Admin email
   * @returns {Promise<Object>} Created admin or success message
   * @throws {Error} With appropriate status codes (409, 404, 400)
   */
  addAdmin: async (email) => {
    try {
      const response = await api.post('/admin/users', {
        email,
        role: 'ADMIN' // Explicitly set role
      });

      if (response.success === false) {
        throw new Error(response.message || 'Failed to add admin');
      }

      // Return standardized response
      return {
        success: true,
        message: response.message || 'Admin added successfully',
        admin: {
          email,
          role: 'ADMIN',
          ...response.admin
        }
      };
    } catch (error) {
      console.error('Error adding admin:', error);

      // Standardize error responses
      if (error.response?.status === 409) {
        throw new Error('This email is already registered as an admin.');
      } else if (error.response?.status === 404) {
        throw new Error('User not found with this email.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid email format.');
      }

      throw new Error(error.response?.data?.message || error.message || 'Failed to add admin');
    }
  },

  /**
   * Remove an admin by email
   * @param {string} email Admin email
   * @returns {Promise<Object>} Success response
   * @throws {Error} With appropriate status codes (403, 404)
   */
  removeAdmin: async (email) => {
    try {
      // Get current user info to prevent self-removal
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.email === email) {
        throw new Error('You cannot remove yourself as an admin.');
      }

      const response = await api.delete(`/admin/users/${encodeURIComponent(email)}`);

      return {
        success: true,
        message: 'Admin removed successfully',
        email
      };
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
    }
  },
  /**
   * Get admin time slot availability
   * @param {Object} params Query parameters
   * @param {string} params.startDate Start date in YYYY-MM-DD format
   * @param {string} params.endDate End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Object containing time slot availability data
   */
  getSlotAvailability: async (params = {}) => {
    try {
      const response = await api.get('/admin/slots/availability/simple', { params });
      console.log('GET slots/availability/simple response:', response);
      return response;
    } catch (error) {
      console.error('Error getting slot availability:', error);
      throw error;
    }
  },

  /**
   * Get admin's marked time slots
   * @param {Object} params Query parameters
   * @param {string} params.startDate Start date in YYYY-MM-DD format
   * @param {string} params.endDate End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Object containing marked time slots data
   */
  getMarkedAvailability: async (params = {}) => {
    try {
      // Get and validate the admin token
      const token = api.getValidToken();

      if (!token) {
        console.warn('No valid admin token available for getMarkedAvailability. Please login first.');
        throw new Error('Authentication required. Please login again.');
      }

      // Make the API request with explicit token
      const response = await api.get('/admin/availability/marked', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('GET /admin/availability/marked response:', response);
      return response;
    } catch (error) {
      console.error('Error getting marked availability:', error);

      // Handle specific authentication errors
      if (error.response?.status === 401) {
        console.error('Authentication failed: Invalid or expired token');
        throw new Error('Your session has expired. Please login again.');
      } else if (error.response?.status === 403) {
        console.error('Authorization failed: Insufficient permissions');
        throw new Error('You do not have permission to access this resource.');
      }

      throw error;
    }
  },

  /**
   * Update admin's availability with selected slots
   * @param {Object} data Object containing selectedSlots array
   * @param {Array} data.selectedSlots Array of slot objects with date and time properties
   * @returns {Promise<Object>} Updated availability data with added and removed counts
   * @example
   * // Expected response format:
   * // {
   * //   success: true,
   * //   added: 2,
   * //   removed: 1,
   * //   addedSlots: [
   * //     { date: "2025-05-18", time: "08:00", timeSlotId: 123 },
   * //     { date: "2025-05-18", time: "09:00", timeSlotId: 124 }
   * //   ],
   * //   message: "Successfully updated availability: 2 slots added, 1 slots removed"
   * // }
   */
  updateAvailability: async (data) => {
    try {
      // Get and validate the admin token
      const token = api.getValidToken();

      if (!token) {
        console.warn('No valid admin token available for updateAvailability. Please login first.');
        throw new Error('Authentication required. Please login again.');
      }

      // Validate the data format
      if (!data.selectedSlots || !Array.isArray(data.selectedSlots)) {
        throw new Error('Invalid data format: selectedSlots must be an array');
      }

      // Ensure each slot has the required date and time properties
      for (const slot of data.selectedSlots) {
        if (!slot.date || !slot.time) {
          throw new Error('Invalid slot format: Each slot must have date and time properties');
        }
      }

      // Log the token format for debugging (first few characters only)
      console.log('Token format check:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 10) + '...',
        tokenFormat: api.isValidToken(token) ? 'Valid JWT format' : 'Invalid JWT format'
      });

      console.log(`Sending ${data.selectedSlots.length} slots to API:`, data);

      // Make the API request with explicit token
      // Using the exact endpoint: POST /api/admin/availability/update
      const response = await api.post('/admin/availability/update', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('POST /admin/availability/update response:', response);

      // Ensure the response has the expected format
      const standardizedResponse = {
        success: response.success !== false,
        added: response.added || 0,
        removed: response.removed || 0,
        addedSlots: response.addedSlots || [],
        message: response.message || `Successfully updated availability: ${response.added || 0} slots added, ${response.removed || 0} slots removed`
      };

      return standardizedResponse;
    } catch (error) {
      console.error('Error updating availability:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('Authentication failed: Invalid or expired token');
        throw new Error('Your session has expired. Please login again.');
      } else if (error.response?.status === 403) {
        console.error('Authorization failed: Insufficient permissions');
        throw new Error('You do not have permission to access this resource.');
      } else if (error.response?.status === 400) {
        console.error('Bad request: Invalid data format');
        throw new Error('Invalid data format: ' + (error.response.data?.message || 'Please check your input'));
      } else if (error.response?.status === 409) {
        // Handle conflict error - typically when trying to remove booked slots
        console.error('Conflict error:', error.response.data);

        // Extract conflict information
        const conflicts = error.response.data?.conflicts || [];
        const message = error.response.data?.message || 'Cannot update slots due to conflicts';

        // Create a detailed error object that includes the conflicts
        const conflictError = new Error(message);
        conflictError.conflicts = conflicts;
        conflictError.isConflictError = true;

        throw conflictError;
      }

      throw error;
    }
  },

  /**
   * Save admin time slot availability using simplified format
   * @deprecated Use updateAvailability instead with the POST /api/admin/availability/update endpoint
   * @param {Array} slots Array of slot objects with date, time, available and booked properties
   * @returns {Promise<Object>} Updated slots availability
   */  saveSimplifiedAvailability: async (slots) => {
    try {
      console.log('Sending slots to API:', slots);
      console.log('GRID DATE/TIME VALUES:', slots.map(s => `${s.date} at ${s.time}`).join(', '));

      // Make sure we're using the grid dates and times from the UI
      const slotsWithGridValues = slots.map(slot => ({
        date: slot.date,       // We're now sending the direct grid date value
        time: slot.time,       // We're now sending the direct grid time value
        available: slot.available !== false, // Default to true if not specified
        booked: slot.booked === true         // Default to false if not specified
      }));

      // Make sure to send the slots wrapped in an object with 'slots' property
      const response = await api.put('/admin/slots/availability/simple', { slots: slotsWithGridValues });
      console.log('PUT slots/availability/simple response:', response);
      return response;
    } catch (error) {
      console.error('Error saving slot availability:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Update available time slots
   * @deprecated Use updateAvailability instead with the POST /api/admin/availability/update endpoint
   * @param {Array} slots Array of slot objects
   * @returns {Promise<Object>} Updated slots
   */
  updateTimeSlots: async (slots) => {
    console.warn('updateTimeSlots is deprecated. Use updateAvailability instead.');
    return api.post('/admin/slots', { slots });
  },

  /**
   * Get all available time slots
   * @param {Object} params Query parameters
   * @param {string} params.startDate Start date in YYYY-MM-DD format
   * @param {string} params.endDate End date in YYYY-MM-DD format
   * @param {string} params.timeFormat Time format preference ('12h' or '24h')
   * @param {boolean} params.includeReserved Whether to include reserved slots
   * @returns {Promise<Object>} Object containing time slot data
   */
  getTimeSlots: async (params = {}) => {
    return api.get('/admin/slots', { params });
  },

  /**
   * Get a specific time slot by ID
   * @param {string} slotId The ID of the time slot to retrieve
   * @returns {Promise<Object>} Time slot data
   */
  getTimeSlotById: async (slotId) => {
    return api.get(`/admin/slots/${slotId}`);
  },

  /**
   * Create a new time slot
   * @param {Object} slotData The time slot data to create
   * @param {string} slotData.date Date in YYYY-MM-DD format
   * @param {string} slotData.time Time in format (e.g., "9:00 AM" or "14:00")
   * @param {boolean} slotData.isAvailable Whether the slot is available
   * @returns {Promise<Object>} Created time slot
   */
  createTimeSlot: async (slotData) => {
    return api.post('/admin/slots/create', slotData);
  },

  /**
   * Update a specific time slot
   * @param {string} slotId The ID of the time slot to update
   * @param {Object} slotData The time slot data to update
   * @param {boolean} slotData.isAvailable Whether the slot is available
   * @returns {Promise<Object>} Updated time slot
   */
  updateTimeSlot: async (slotId, slotData) => {
    return api.patch(`/admin/slots/${slotId}`, slotData);
  },

  /**
   * Delete a specific time slot
   * @param {string} slotId The ID of the time slot to delete
   * @returns {Promise<Object>} Success response
   */
  deleteTimeSlot: async (slotId) => {
    return api.delete(`/admin/slots/${slotId}`);
  },

  /**
   * Create multiple time slots in a date range
   * @param {Object} rangeData The date range and time data
   * @param {string} rangeData.startDate Start date in YYYY-MM-DD format
   * @param {string} rangeData.endDate End date in YYYY-MM-DD format
   * @param {Array<string>} rangeData.times Array of times in format (e.g., "9:00 AM" or "14:00")
   * @param {Array<string>} rangeData.daysOfWeek Array of days of week to include (0-6, Sunday is 0)
   * @returns {Promise<Object>} Created time slots info
   */
  createTimeSlotRange: async (rangeData) => {
    return api.post('/admin/slots/range', rangeData);
  },

  /**
   * Get detailed debug information about time slots
   * @param {Object} params Query parameters
   * @param {number} params.days Number of days to include (default: 60)
   * @param {boolean} params.showAll Whether to include all slot details (default: true)
   * @param {string} params.startDate Override start date (YYYY-MM-DD)
   * @param {string} params.endDate Override end date (YYYY-MM-DD)
   * @param {string} params.timeFormat Time format preference ('12h' or '24h')
   * @returns {Promise<Object>} Detailed time slot information
   */
  getTimeSlotsDebug: async (params = {}) => {
    return api.get('/admin/slots/debug', { params });
  },  /**
   * Get reports with flexible filtering options
   * @param {Object} options - Report filtering and pagination options
   * @param {string} options.status - Filter by status ('unreviewed', 'reviewed', 'pending-feedback', or 'all')
   * @param {number} options.page - Page number for pagination (default: 1)
   * @param {number} options.limit - Number of reports per page (default: 10)
   * @param {string} options.startDate - Start date for filtering (YYYY-MM-DD)
   * @param {string} options.endDate - End date for filtering (YYYY-MM-DD)
   * @returns {Promise<Object>} List of reports with pagination info
   */
  getReports: async (options = {}) => {
    try {
      const {
        status = 'all',
        page = 1,
        limit = 10,
        startDate,
        endDate
      } = options;

      // Filter out undefined/empty values
      const params = Object.fromEntries(
        Object.entries({
          page,
          limit,
          startDate,
          endDate
        }).filter(([_, value]) => value !== undefined && value !== '')
      );

      const queryParams = new URLSearchParams(params);
      let endpoint;

      // Select appropriate endpoint based on status filter
      switch(status) {
        case 'pending-feedback':
          endpoint = '/admin/reports/pending-feedback';
          break;
        case 'unreviewed':
        case 'reviewed':
          endpoint = `/admin/reports/status`;
          queryParams.append('status', status);
          break;
        case 'all':
        default:
          endpoint = '/admin/reports/all';
          break;
      }

      console.log(`Fetching reports with params: ${queryParams.toString()}`);
      const response = await api.get(`${endpoint}?${queryParams.toString()}`);
      console.log(`Reports (${status}) response:`, response);
      return response;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },
    /**
   * Get reports that need feedback (alias for getReports with status='pending-feedback')
   * @param {number} page Page number for pagination
   * @param {number} limit Number of reports per page
   * @returns {Promise<Object>} Reports without feedback
   */
  getReportsWithoutFeedback: async (page = 1, limit = 10) => {
    return adminService.getReports({ status: 'pending-feedback', page, limit });
  },/**
   * Report feedback management methods
   */  reportFeedback: {
    /**
     * Add feedback to a report
     * @param {string} reportId Report ID
     * @param {Object} feedback Feedback content object containing content field
     * @returns {Promise<Object>} Updated report
     */
    add: async (reportId, feedback) => {
      try {
        console.log(`Adding feedback to report ${reportId}:`, feedback);
        // Make sure we pass the message in the format expected by the API
        const payload = { message: feedback.content };
        const response = await api.post(`/admin/reports/${reportId}/feedback`, payload);
        console.log('Feedback added, response:', response);
        return response;
      } catch (error) {
        console.error('Error adding feedback:', error);
        throw error;
      }
    },

    /**
     * Delete feedback from a report
     * @param {string} reportId Report ID
     * @param {string} feedbackId Feedback ID
     * @returns {Promise<Object>} Updated report
     */
    delete: async (reportId, feedbackId) => {
      try {
        console.log(`Deleting feedback ${feedbackId} from report ${reportId}`);
        const response = await api.delete(`/admin/reports/${reportId}/feedback/${feedbackId}`);
        console.log('Feedback deleted, response:', response);
        return response;
      } catch (error) {
        console.error('Error deleting feedback:', error);
        throw error;
      }
    },

    /**
     * Get all feedback with optional filters
     * @param {Object} options Pagination and filter options
     * @param {number} options.page Page number
     * @param {number} options.limit Items per page
     * @param {number} options.adminId Filter by admin ID
     * @param {number} options.reportId Filter by report ID
     * @param {string} options.startDate Start date filter (YYYY-MM-DD)
     * @param {string} options.endDate End date filter (YYYY-MM-DD)
     * @param {string} options.searchTerm Search in feedback content
     * @param {string} options.order Sort order ("asc" or "desc")
     * @returns {Promise<Object>} Feedback list with pagination
     */
    getAll: async (options = {}) => {
      try {
        const { page = 1, limit = 10, ...filters } = options;

        // Filter out undefined/empty values
        const cleanFilters = Object.fromEntries(
          Object.entries({ page, limit, ...filters })
            .filter(([_, value]) => value !== undefined && value !== '')
        );

        const queryParams = new URLSearchParams(cleanFilters);

        console.log(`Fetching all feedback with params: ${queryParams.toString()}`);
        const response = await api.get(`/feedback?${queryParams.toString()}`);
        console.log('All feedback response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching all feedback:', error);
        throw error;
      }
    }
  },
  /**
   * Delete an admin profile (self)
   * @returns {Promise<Object>} Response data
   */
  deleteAdminProfile: async () => {
    try {
      // Log token before making request for debugging
      const token = localStorage.getItem('authToken');
      console.log('Delete admin profile - Token exists:', !!token);
      console.log('Delete admin profile - Auth state:', {
        isAdmin: localStorage.getItem('isAdmin'),
        userRole: localStorage.getItem('userRole')
      });

      // Using explicit axios call with token for reliable auth
      const response = await api.delete('/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response;
    } catch (error) {
      console.error('Error deleting admin profile:', error);
      throw error;
    }
  },

  /**
   * Delete an admin profile (self) using a specific endpoint
   * @param {string} endpoint The API endpoint to use
   * @returns {Promise<Object>} Response data
   */
  deleteAdminProfileWithEndpoint: async (endpoint) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log(`Deleting admin profile with custom endpoint: ${endpoint}`);
      console.log('Delete admin profile - Token exists:', !!token);

      const response = await api.delete(endpoint);
      return response;
    } catch (error) {
      console.error(`Error deleting admin profile with endpoint ${endpoint}:`, error);
      throw error;
    }
  },
  /**
   * Delete a user profile by email (admin function)
   * @param {string} email User email to delete
   * @returns {Promise<Object>} Response with no content (204)
   * @throws {Error} With appropriate status codes (403, 404)
   */
  deleteUserProfile: async (email) => {
    try {
      // Log token before making request for debugging
      const token = localStorage.getItem('authToken');
      console.log('Delete user profile - Token exists:', !!token);
      console.log('Delete user profile - Auth state:', {
        isAdmin: localStorage.getItem('isAdmin'),
        userRole: localStorage.getItem('userRole'),
        email: email
      });

      // Using explicit axios call with token for reliable auth
      const response = await api.delete(`/admin/profiles/${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  },

  /**
   * Helper function to test admin endpoints
   * @returns {Promise<Object>} Information about available admin endpoints
   */
  testAdminEndpoints: async () => {
    try {
      console.log('Testing admin API endpoints...');
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.error('No authentication token available for endpoint testing');
        return { success: false, message: 'No authentication token available' };
      }

      // Try potential endpoints for admin profile deletion
      const endpoints = [
        '/admin/me',
        '/admin/profile',
        '/admin/profiles/me',
        '/admin-auth/profile'
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          // Use HEAD request to test availability without making changes
          await api.head(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
          results[endpoint] = 'Available';
        } catch (err) {
          const status = err.response?.status;
          results[endpoint] = status === 401 || status === 403
            ? 'Requires different auth'
            : status === 404
              ? 'Not found'
              : `Error: ${status || 'Unknown'}`;
        }
      }

      console.log('Endpoint test results:', results);
      return {
        success: true,
        results,
        recommendedEndpoint: Object.entries(results)
          .find(([ep, status]) => status === 'Available')?.[0] || null
      };
    } catch (error) {
      console.error('Error testing admin endpoints:', error);
      return { success: false, message: error.message };
    }
  },
  /**
   * Search reports by content or metadata
   * @param {string} searchTerm The search term to look for
   * @param {Object} options Additional search options
   * @param {number} options.page Page number (default: 1)
   * @param {number} options.limit Items per page (default: 10)
   * @param {string} options.startDate Start date for search range (YYYY-MM-DD)
   * @param {string} options.endDate End date for search range (YYYY-MM-DD)
   * @returns {Promise<Object>} Search results with pagination
   */
  searchReports: async (searchTerm, options = {}) => {
    try {
      const { page = 1, limit = 10, startDate, endDate } = options;

      // Filter out undefined/empty values
      const params = Object.fromEntries(
        Object.entries({
          query: searchTerm,
          page,
          limit,
          startDate,
          endDate
        }).filter(([_, value]) => value !== undefined && value !== '')
      );

      const queryParams = new URLSearchParams(params);

      console.log(`Searching reports with params: ${queryParams.toString()}`);
      const response = await api.get(`/admin/reports/search?${queryParams.toString()}`);
      console.log('Search reports response:', response);

      // Handle empty response
      if (!response) {
        return { reports: [], pagination: { page, limit, totalPages: 0, totalReports: 0 } };
      }

      // Return response in a consistent format
      return response;
    } catch (error) {
      console.error('Error searching reports:', error);
      // Provide a structured error response that matches our expected format
      throw new Error(error.response?.data?.message || error.message || 'Failed to search reports');
    }
  },

  /**
   * Delete a report (admin function)
   * @param {string} reportId The ID of the report to delete
   * @returns {Promise<Object>} Success response
   */
  // deleteReport: async (reportId) => {
  //   try {
  //     console.log(`Admin deleting report with ID: ${reportId}`);
  //     const response = await api.delete(`/admin/reports/${reportId}`);
  //     console.log('Report deleted successfully:', response);
  //     return response;
  //   } catch (error) {
  //     console.error('Error deleting report:', error);
  //     // Handle specific error cases
  //     if (error.response?.status === 404) {
  //       throw new Error('Report not found');
  //     } else if (error.response?.status === 403) {
  //       throw new Error('Not authorized to delete this report');
  //     }
  //     throw error;
  //   }
  // },
      /**
   * Add feedback to a report
   * @param {string} reportId Report ID
   * @param {Object} feedback Feedback content
   * @returns {Promise<Object>} Updated report
   */
  addReportFeedback: async (reportId, feedback) => {
    try {
      console.log(`Adding feedback to report ${reportId}:`, feedback);
      // Ensure we're using the 'message' field as expected by the API
      const payload = {
        message: feedback.content
      };
      // The baseURL already includes '/api', so we should not repeat it
      const response = await api.post(`/admin/reports/${reportId}/feedback`, payload);
      console.log('Feedback added, response:', response);
      return response.data; // Return data directly to match expected format
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  },

  deleteReportFeedback: async (reportId, feedbackId) => {
    try {
      console.log(`Deleting feedback ${feedbackId} from report ${reportId}`);
      const response = await api.delete(`/admin/reports/${reportId}/feedback/${feedbackId}`);
      console.log('Feedback deleted, response:', response);
      return response;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },
};

export default adminService;
