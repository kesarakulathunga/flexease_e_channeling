// src/services/profileService.js
import api from './api';
import axios from 'axios';

/**
 * Service for profile-related operations
 */
const profileService = {
  /**
   * Confirm patient profile deletion before actually deleting
   * @param {string|number} patientId The ID of the patient profile to confirm deletion for
   * @returns {Promise<Object>} Response with confirmation status
   */
  confirmProfileDeletion: async (patientId) => {
    try {
      console.log(`Confirming deletion for patient profile with ID: ${patientId}`);

      // Call the confirmation endpoint
      const response = await api.post(`/api/profile/patient/${patientId}/confirm-deletion`);

      console.log('Profile deletion confirmation successful:', response);

      return {
        success: true,
        message: response.message || 'Profile deletion confirmed',
        confirmationId: response.confirmationId || null
      };
    } catch (error) {
      console.error('Error confirming patient profile deletion:', error);

      // Check for specific error responses
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.message || error.response.data?.error ||
                            'An error occurred while confirming profile deletion';

        if (status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (status === 403) {
          throw new Error('You do not have permission to delete this profile.');
        } else if (status === 404) {
          throw new Error('Profile not found.');
        } else {
          throw new Error(errorMessage);
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection and try again.');
      } else {
        throw new Error('An error occurred while processing your request.');
      }
    }
  },
  /**
   * Delete all appointments for a patient
   * @param {string|number} patientId The ID of the patient
   * @param {boolean} onlyCancelable Whether to delete only cancelable appointments
   * @returns {Promise<Object>} Response with success status and count
   */
  /**
   * Delete all patient appointments using the new API endpoint
   * @param {string|number} patientId The ID of the patient
   * @returns {Promise<Object>} Response with success status and deleted appointments
   */
  deleteAllPatientAppointments: async (patientId) => {
    try {
      console.log(`Deleting all appointments for patient ID: ${patientId} using new API endpoint`);

      // Use the base URL from the api service or environment variables
      const baseUrl = api.defaults.baseURL || 'http://localhost:4000/api';
      const url = `${baseUrl}/patient-appointments/delete-all`;

      // Make the POST request to the new endpoint
      const response = await axios.post(url, { patientId });

      console.log('All appointments deletion response:', response.data);

      return {
        success: true,
        message: response.data.message || 'Successfully deleted all appointments',
        count: response.data.deletedCount || 0,
        deletedAppointments: response.data.deletedAppointments || []
      };
    } catch (error) {
      console.error('Error deleting all patient appointments:', error);

      // Handle specific error responses
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData.details || errorData.error || 'Failed to delete appointments');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection and try again.');
      } else {
        throw new Error('An error occurred while processing your request.');
      }
    }
  },

  /**
   * Legacy method for deleting patient appointments (kept for backward compatibility)
   * @param {string|number} patientId The ID of the patient
   * @param {boolean} onlyCancelable Whether to delete only cancelable appointments
   * @returns {Promise<Object>} Response with success status and count
   */
  deletePatientAppointments: async (patientId, onlyCancelable = true) => {
    try {
      console.log(`Legacy method called for patient ID: ${patientId}`);

      // Call the new method instead
      const result = await profileService.deleteAllPatientAppointments(patientId);

      return {
        success: result.success,
        message: result.message,
        count: result.count
      };
    } catch (error) {
      console.error('Error in appointment deletion:', error);
      throw error;
    }
  },

  /**
   * Delete a patient profile
   * @param {string|number} patientId The ID of the patient profile to delete
   * @returns {Promise<Object>} Response with success status and message
   */
  deletePatientProfile: async (patientId) => {
    try {
      console.log(`Attempting to delete patient profile with ID: ${patientId}`);

      // Call the DELETE endpoint
      const response = await api.delete(`/profile/patient/${patientId}`);

      console.log('Profile deletion successful:', response);

      return {
        success: true,
        message: response.message || 'Profile deleted successfully',
        redirect: response.redirect || '/'
      };
    } catch (error) {
      console.error('Error deleting patient profile:', error);

      // Check for specific error responses
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const errorMessage = error.response.data?.message || error.response.data?.error ||
                            'An error occurred while deleting your profile';

        if (status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (status === 403) {
          throw new Error('You do not have permission to delete this profile.');
        } else if (status === 404) {
          throw new Error('Profile not found.');
        } else {
          throw new Error(errorMessage);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('An error occurred while processing your request.');
      }
    }
  },

  /**
   * Get connected APIs that need to be deleted when a profile is deleted
   * @param {string|number} patientId The ID of the patient profile
   * @returns {Promise<Array>} List of connected services/data that will be deleted
   */
  getConnectedProfileData: async (patientId) => {
    try {
      const response = await api.get(`/profile/patient/${patientId}/connected-data`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching connected profile data:', error);
      // Return a default list if the API is not available
      return [
        { type: 'appointments', label: 'Appointments' },
        { type: 'medical_records', label: 'Medical Records' },
        { type: 'prescriptions', label: 'Prescriptions' },
        { type: 'billing', label: 'Billing Information' }
      ];
    }
  }
};

export default profileService;
