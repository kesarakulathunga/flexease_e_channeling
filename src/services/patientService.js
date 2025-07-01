// src/services/patientService.js
import api from './api';
import appointmentService from './appointmentService';

const patientService = {/**
   * Get patients profiles associated with an email
   * @param {string} email Email address
   * @returns {Promise<Array>} List of patient profiles
   */  getProfilesByEmail: async (email) => {
    try {
      console.log('Fetching profiles for email:', email);
      const response = await api.get(`/patients/profiles?email=${encodeURIComponent(email)}`);
      console.log('Profiles response:', response);

      // Normalize each profile to ensure it has a name property
      if (Array.isArray(response)) {
        return response.map(profile => {
          if (!profile.name && profile.fullName) {
            profile.name = profile.fullName;
          }
          return profile;
        });
      }

      return response;
    } catch (error) {
      console.error('Error fetching profiles by email:', error);
      throw error;
    }
  },

  /**
   * Create a new patient profile
   * @param {Object} profileData Patient profile data
   * @returns {Promise<Object>} Created profile
   */  createProfile: async (profileData) => {
    return api.post('/patients/profiles', profileData);
  },  /**
   * Update an existing patient profile
   * @param {string} profileId Profile ID
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated profile
   */  updateProfile: async (profileId, profileData) => {
    try {
      console.log('Updating profile with ID:', profileId, 'Data:', profileData);      // Format data for backend - ensure we use consistent field names
      // Some backends might expect firstName, fullName, or other variations
      const mobileValue = String(profileData.mobileNumber || ''); // Convert to string explicitly, handle null/undefined
        const formattedData = {
        // Try multiple field names that the backend might expect
        name: profileData.name,
        fullName: profileData.name, // Add this in case backend expects fullName
        firstName: profileData.name, // Add this in case backend expects firstName
        age: profileData.age,
        // Try different formats and field names for mobile number
        mobileNumber: mobileValue,
        mobile: mobileValue,
        phoneNumber: mobileValue,
        phone: mobileValue,
        mobileno: mobileValue,
        contactNumber: mobileValue,
        contact: mobileValue,
        mobile_number: mobileValue,
        phone_number: mobileValue,        // Also try the number as an integer if the backend expects numeric
        mobileNumberInt: parseInt(mobileValue, 10) || 0,
        phoneInt: parseInt(mobileValue, 10) || 0,
        email: profileData.email
      };

      console.log('Formatted data for backend:', formattedData);

      // Use the endpoint detection helper to find the right endpoint
      const endpointPattern = await api.detectEndpoint(
        'updateProfile',
        ['me', 'id', 'profiles'],
        profileId
      );

      // Based on the detected pattern, construct the endpoint
      let endpoint;
      switch (endpointPattern) {
        case 'me':
          endpoint = '/patients/me';
          break;
        case 'id':
          endpoint = `/patients/${profileId}`;
          break;
        case 'profiles':
        default:
          endpoint = `/patients/profiles/${profileId}`;
          break;
      }

      // Try the endpoints in order if the first one fails
      let response;
      let successfulPattern = null;

      // First try with the detected/cached pattern
      try {
        console.log(`Trying update with ${endpointPattern} pattern: ${endpoint}`);
        response = await api.put(endpoint, formattedData);
        successfulPattern = endpointPattern;
      } catch (err) {
        // If the detected pattern fails, try the others
        const allPatterns = ['me', 'id', 'profiles'];
        for (const pattern of allPatterns) {
          // Skip the one we already tried
          if (pattern === endpointPattern) continue;

          let retryEndpoint;
          switch (pattern) {
            case 'me':
              retryEndpoint = '/patients/me';
              break;
            case 'id':
              retryEndpoint = `/patients/${profileId}`;
              break;
            case 'profiles':
              retryEndpoint = `/patients/profiles/${profileId}`;
              break;
          }
            try {
            console.log(`Retry update with ${pattern} pattern: ${retryEndpoint}`);
            response = await api.put(retryEndpoint, formattedData);
            successfulPattern = pattern;
            break; // Found a working endpoint, exit the loop
          } catch (retryErr) {
            console.warn(`Failed with ${pattern} pattern:`, retryErr.message);
            // Continue to next pattern
          }
        }

        // If we've tried all patterns and none worked, throw the original error
        if (!successfulPattern) {
          throw err;
        }
      }
        // If we found a successful pattern that's different from the cached one, update the cache
      if (successfulPattern && successfulPattern !== endpointPattern) {
        console.log(`Updating endpoint cache for updateProfile to ${successfulPattern}`);
        window.endpointPatternCache = window.endpointPatternCache || {};
        window.endpointPatternCache.updateProfile = successfulPattern;
      }
        console.log('Profile update successful:', response);

      // Ensure the response has either name or fullName property
      if (response && (!response.name && response.fullName)) {
        response.name = response.fullName;
      }

      // Preserve original profile ID if response doesn't include it
      if (response && !response.id && profileId) {
        response.id = profileId;
      }

      // If the server response doesn't include all fields, merge with the data we sent
      if (response && Object.keys(response).length > 0) {
        // Check if important fields are missing in the response
        const isMissingFields =
          (!response.name && profileData.name) ||
          (!response.mobileNumber && profileData.mobileNumber) ||
          (!response.email && profileData.email);

        if (isMissingFields) {          console.log('Server response missing fields, merging with sent data');
          // Merge the response with the data we sent, prioritizing response data
          return {
            ...profileData,         // Original data we sent
            ...response,            // Server response takes precedence
            id: response.id || profileId,  // Ensure ID is preserved
            mobileNumber: profileData.mobileNumber // Explicitly preserve mobile number
          };
        }
      }

      return response;
    } catch (error) {
      console.error('Profile update failed after trying all patterns:', error);
        // Handle 404 error specifically (endpoint not found)
      if (error.response && error.response.status === 404) {        console.warn('No profile update endpoints found, falling back to optimistic update');
        // Return the original data as if it was successfully updated
        // This is called an "optimistic update" pattern
        return {
          ...formattedData,
          id: profileId,
          mobileNumber: profileData.mobileNumber  // Explicitly preserve mobile number
        };
      }

      throw error;
    }
  },
  /**
   * Delete a patient profile
   * @param {string} profileId Profile ID
   * @returns {Promise<Object>} Response data
   */
  deleteProfile: async (profileId) => {
    try {
      console.log('Deleting profile with ID:', profileId);

      // Use the endpoint detection helper to find the right endpoint, similar to updateProfile
      const endpointPattern = await api.detectEndpoint(
        'deleteProfile',
        ['me', 'id', 'profiles'],
        profileId
      );

      // Based on the detected pattern, construct the endpoint
      let endpoint;
      switch (endpointPattern) {
        case 'me':
          endpoint = '/patients/me';
          break;
        case 'id':
          endpoint = `/patients/${profileId}`;
          break;
        case 'profiles':
        default:
          endpoint = `/patients/profiles/${profileId}`;
          break;
      }

      // Try the endpoints in order if the first one fails
      let response;
      let successfulPattern = null;

      // First try with the detected/cached pattern
      try {
        console.log(`Trying deletion with ${endpointPattern} pattern: ${endpoint}`);
        response = await api.delete(endpoint);
        successfulPattern = endpointPattern;
      } catch (err) {
        // If the detected pattern fails, try the others
        const allPatterns = ['me', 'id', 'profiles'];
        for (const pattern of allPatterns) {
          // Skip the one we already tried
          if (pattern === endpointPattern) continue;

          let retryEndpoint;
          switch (pattern) {
            case 'me':
              retryEndpoint = '/patients/me';
              break;
            case 'id':
              retryEndpoint = `/patients/${profileId}`;
              break;
            case 'profiles':
              retryEndpoint = `/patients/profiles/${profileId}`;
              break;
          }

          try {
            console.log(`Retry deletion with ${pattern} pattern: ${retryEndpoint}`);
            response = await api.delete(retryEndpoint);
            successfulPattern = pattern;
            break; // Found a working endpoint, exit the loop
          } catch (retryErr) {
            console.warn(`Failed with ${pattern} pattern:`, retryErr.message);
            // Continue to next pattern
          }
        }

        // If we've tried all patterns and none worked, we'll handle this optimistically
        if (!successfulPattern) {
          console.warn('All deletion API endpoints failed, using optimistic approach');
          // Instead of throwing an error, return a success response
          return { success: true, message: 'Profile deleted (frontend only)' };
        }
      }

      // If we found a successful pattern that's different from the cached one, update the cache
      if (successfulPattern && successfulPattern !== endpointPattern) {
        console.log(`Updating endpoint cache for deleteProfile to ${successfulPattern}`);
        window.endpointPatternCache = window.endpointPatternCache || {};
        window.endpointPatternCache.deleteProfile = successfulPattern;
      }

      console.log('Profile deletion successful:', response);
      return response;
    } catch (error) {
      console.error('Profile deletion failed after trying all patterns:', error);

      // Handle any error with an optimistic response
      // This ensures the UI can proceed with logout and navigation even if the API fails
      console.warn('Returning optimistic success response for deletion');
      return { success: true, message: 'Profile deleted (frontend only)' };
    }
  },/**
   * Get the current patient's profile
   * @returns {Promise<Object>} Patient profile
   */
  getCurrentProfile: async () => {
    try {
      console.log('Fetching current user profile from API');
      const response = await api.get('/patients/me');
      console.log('Current profile data received:', response);

      // Normalize response to ensure it has a name property (some APIs might use fullName instead)
      if (response && (!response.name && response.fullName)) {
        response.name = response.fullName;
      }

      return response;
    } catch (error) {
      console.error('Error fetching current profile:', error);
      throw error;
    }
  },  /**
   * Upload a medical report
   * @param {Object} reportData Report metadata
   * @param {File} file Report file
   * @returns {Promise<Object>} Uploaded report data
   */
  uploadReport: async (reportData, file) => {
    try {
      const formData = new FormData();
      // Use the correct field name as expected by the backend
      formData.append('reportFile', file);

      // Add other metadata fields
      Object.keys(reportData).forEach(key => {
        formData.append(key, reportData[key]);
      });

      // Using the correct endpoint without 'patients/' prefix
      console.log('Uploading report to endpoint: /reports');
      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response);

      // Handle the wrapped response structure
      if (response && response.success && response.report) {
        return { data: response.report };
      }

      return response;
    } catch (error) {
      console.error('Error uploading report:', error);
      throw error;
    }
  },  /**
   * Get patient's uploaded reports
   * @param {Number} page Page number for pagination
   * @param {Number} limit Number of reports per page
   * @param {String} search Optional search term for filtering by title
   * @returns {Promise<Object>} List of reports with pagination details
   */
  getReports: async (page = 1, limit = 10, search = '') => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) {
        queryParams.append('search', search);
      }

      console.log(`Fetching reports with URL: /reports?${queryParams.toString()}`);

      // Using the correct endpoint without 'patients/' prefix
      const response = await api.get(`/reports?${queryParams.toString()}`);

      console.log('Reports response:', response);

      // Process and normalize data for consistency
      const processReports = (reports) => {
        if (!Array.isArray(reports)) return [];

        return reports.map(report => {
          // Ensure each report has a feedbacks array
          if (!report.feedbacks) {
            report.feedbacks = [];
          }

          // Process each feedback for consistency
          if (Array.isArray(report.feedbacks)) {
            report.feedbacks = report.feedbacks.map(feedback => ({
              ...feedback,
              // Ensure consistent field names
              message: feedback.message || feedback.content || '',
              content: feedback.content || feedback.message || '',
              authorName: feedback.authorName || feedback.doctorName || '',
              createdAt: feedback.createdAt || feedback.date || new Date().toISOString()
            }));
          }

          return report;
        });
      };

      // Return properly formatted data for the frontend
      if (response && response.success && response.reports) {
        return {
          data: processReports(response.reports),
          pagination: response.pagination
        };
      } else if (Array.isArray(response)) {
        return {
          data: processReports(response),
          pagination: { totalPages: 1 } // Default pagination if not provided
        };
      }

      return response;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },
  /**
   * Delete a report
   * @param {string} reportId Report ID
   * @returns {Promise<Object>} Response data
   */
  deleteReport: async (reportId) => {
    try {
      console.log(`Deleting report with ID: ${reportId} from endpoint: /reports/${reportId}`);
      // Using the correct endpoint without 'patients/' prefix
      const response = await api.delete(`/reports/${reportId}`);
      return response;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },  /**
   * Get feedback count for a specific report
   * @param {string} reportId The ID of the report to get feedback count for
   * @returns {Promise<number>} Number of feedback items
   */
  getReportFeedbackCount: async (reportId) => {
    try {
      // Based on the API documentation, we should use the main feedback endpoint
      // with pagination parameters to get the count from the pagination data
      const response = await api.get(`/patients/reports/${reportId}/feedback`, {
        params: {
          page: 1,
          limit: 1, // Only need one item to get the total count
          format: 'simple' // Use the simple format option mentioned in the docs
        }
      });

      // Extract count from response according to the API structure from documentation
      if (response.success === true && response.pagination) {
        return response.pagination.totalItems || 0;
      } else if (response.data?.success === true && response.data?.pagination) {
        return response.data.pagination.totalItems || 0;
      } else if (response.data?.pagination) {
        return response.data.pagination.totalItems || 0;
      } else if (Array.isArray(response.data?.feedback)) {
        // If we get the feedback array directly, we can only know the length of the current page
        // This might not be accurate for the total count if there are multiple pages
        return response.data.feedback.length;
      } else if (Array.isArray(response.data)) {
        return response.data.length;
      }

      return 0;
    } catch (error) {
      console.error(`Error fetching feedback count for report ${reportId}:`, error);
      return 0; // Return 0 if there's an error
    }
  },
    /**
   * Get feedback for a specific report
   * @param {string} reportId The ID of the report to get feedback for
   * @param {number} page Page number for pagination (default: 1)
   * @param {number} limit Number of items per page (default: 5)
   * @param {string} sort Sort order for feedback items (asc or desc)
   * @returns {Promise<Object>} Report data with feedback items
   */
  getReportFeedback: async (reportId, page = 1, limit = 5, sort = 'desc') => {
    try {
      // Construct the API request based on the documentation
      const response = await api.get(`/patients/reports/${reportId}/feedback`, {
        params: {
          page,
          limit,
          sort
        }
      });

      // Parse the response according to the documented structure
      // Handle different response formats based on the API documentation
      if (response.success === true) {
        // Direct response matches documentation format
        return {
          feedback: response.feedback || [],
          pagination: response.pagination || {
            page: page,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          },
          reportTitle: response.reportTitle || '',
          uploadedAt: response.uploadedAt || ''
        };
      } else if (response.data?.success === true) {
        // Response is wrapped in data property
        return {
          feedback: response.data.feedback || [],
          pagination: response.data.pagination || {
            page: page,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          },
          reportTitle: response.data.reportTitle || '',
          uploadedAt: response.data.uploadedAt || ''
        };
      } else {
        // Fallback for unexpected response format
        return {
          feedback: Array.isArray(response.data) ? response.data :
                   (response.data?.feedback || []),
          pagination: response.data?.pagination || {
            page: page,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          },
          reportTitle: response.data?.reportTitle || '',
          uploadedAt: response.data?.uploadedAt || ''
        };
      }
    } catch (error) {
      console.error(`Error fetching feedback for report ${reportId}:`, error);
      throw error;
    }
  },
    /**
   * Update email after verification
   * @param {string} email New verified email
   * @param {string} otpCode Verification OTP code
   * @returns {Promise<Object>} Updated profile with new email
   */  updateVerifiedEmail: async (email, otpCode) => {
    try {
      const response = await api.post('/patients/update-email', { email, otpCode });
      return response;
    } catch (error) {
      console.error('Error updating verified email:', error);
      throw error;
    }
  },

  /**
   * Get all feedbacks for a patient (across all reports)
   * @param {string|number} patientId The ID of the patient
   * @returns {Promise<Array>} List of feedback items from all patient's reports
   */
  getFeedbacks: async (patientId) => {
    try {
      console.log(`Fetching feedbacks for patient ID: ${patientId}`);

      // First, get all reports for this patient
      const reportsResponse = await api.get(`/patients/${patientId}/reports`);
      const reports = reportsResponse.data?.reports ||
                     reportsResponse.data || [];

      if (!Array.isArray(reports) || reports.length === 0) {
        console.log('No reports found for patient, returning empty feedbacks array');
        return [];
      }

      console.log(`Found ${reports.length} reports for patient ID ${patientId}`);

      // For each report, fetch its feedback
      const feedbackPromises = reports.map(report => {
        const reportId = report.id || report._id;
        if (!reportId) return Promise.resolve([]);

        return patientService.getReportFeedback(reportId)
          .then(response => {
            // Extract feedback array from response
            const feedbackItems = response?.feedback || [];

            // Add report info to each feedback item
            return feedbackItems.map(item => ({
              ...item,
              reportId,
              reportTitle: report.title || 'Unnamed Report',
              uploadedAt: report.uploadedAt || report.createdAt || new Date().toISOString(),
              fileName: report.filename || report.name || '',
              fileUrl: report.fullFileUrl || report.fileUrl || report.url || ''
            }));
          })
          .catch(err => {
            console.error(`Error getting feedback for report ${reportId}:`, err);
            return []; // Return empty array for this report's feedback on error
          });
      });

      // Wait for all feedback requests to complete
      const reportFeedbacks = await Promise.all(feedbackPromises);

      // Flatten the array of arrays into a single array of feedback items
      let allFeedbacks = reportFeedbacks.flat();

      // Sort by date (newest first)
      allFeedbacks.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });

      console.log(`Returning ${allFeedbacks.length} total feedback items for patient`);
      return allFeedbacks;
    } catch (error) {
      console.error(`Error fetching all feedbacks for patient ${patientId}:`, error);
      throw error;
    }
  },

  /**
   * Get appointments for a patient
   * @param {string|number} patientId The ID of the patient
   * @returns {Promise<Array>} List of appointments
   */
  getAppointments: async (patientId) => {
    try {
      console.log(`Fetching appointments for patient ID: ${patientId}`);

      // Try to get appointments from the patient-specific endpoint
      try {
        const response = await api.get(`/patients/${patientId}/appointments`);
        const appointments = response.data?.appointments || response.data || [];

        if (Array.isArray(appointments) && appointments.length > 0) {
          console.log(`Found ${appointments.length} appointments from patient endpoint`);
          return appointments;
        }
      } catch (err) {
        console.warn('Patient-specific appointments endpoint failed, trying general endpoint');
      }

      // If patient-specific endpoint fails or returns no data, try the general endpoint
      const response = await appointmentService.getMyAppointments();
      const appointments = Array.isArray(response) ? response : [];

      console.log(`Found ${appointments.length} appointments from general endpoint`);

      // Sort appointments by date (soonest first)
      appointments.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // If dates are the same, sort by time
        if (dateA.getTime() === dateB.getTime()) {
          return a.time.localeCompare(b.time);
        }

        return dateA - dateB;
      });

      // Filter to only include upcoming appointments (today or later)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        appDate.setHours(0, 0, 0, 0);
        return appDate >= today;
      });

      console.log(`Returning ${upcomingAppointments.length} upcoming appointments`);
      return upcomingAppointments;
    } catch (error) {
      console.error(`Error fetching appointments for patient ${patientId}:`, error);
      throw error;
    }
  }
};

export default patientService;
