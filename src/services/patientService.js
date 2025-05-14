// src/services/patientService.js
import api from './api';

const patientService = {  /**
   * Get patients profiles associated with an email
   * @param {string} email Email address
   * @returns {Promise<Array>} List of patient profiles
   */  getProfilesByEmail: async (email) => {
    return api.get(`/profile/patient/by-email?email=${encodeURIComponent(email)}`);
  },  /**
   * Create a new patient profile
   * @param {Object} profileData Patient profile data
   * @returns {Promise<Object>} Created profile
   */  createProfile: async (profileData) => {
    return api.post('/profile/patient', profileData);
  },  /**
   * Update an existing patient profile
   * @param {string} profileId Profile ID
   * @param {Object} profileData Updated profile data
   * @returns {Promise<Object>} Updated profile
   */  updateProfile: async (profileId, profileData) => {
    return api.put(`/profile/patient/${profileId}`, profileData);
  },  /**
   * Delete a patient profile
   * @param {string} profileId Profile ID
   * @returns {Promise<Object>} Response data
   */  deleteProfile: async (profileId) => {
    return api.delete(`/profile/patient/${profileId}`);
  },  /**
   * Get the current patient's profile
   * @returns {Promise<Object>} Patient profile
   */  getCurrentProfile: async () => {
    return api.get('/profile/patient/me');
  },
  /**
   * Upload a medical report
   * @param {Object} reportData Report metadata
   * @param {File} file Report file
   * @returns {Promise<Object>} Uploaded report data
   */
  uploadReport: async (reportData, file) => {
    const formData = new FormData();
    formData.append('file', file);
      // Add other metadata fields
    Object.keys(reportData).forEach(key => {
      formData.append(key, reportData[key]);
    });    return api.post('/profile/patient/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },  /**
   * Get patient's uploaded reports
   * @returns {Promise<Array>} List of reports
   */  getReports: async () => {
    return api.get('/profile/patient/reports');
  },

  /**
   * Delete a report
   * @param {string} reportId Report ID
   * @returns {Promise<Object>} Response data
   */  deleteReport: async (reportId) => {
    return api.delete(`/profile/patient/reports/${reportId}`);
  },  /**
   * Update email after verification
   * @param {string} email New verified email
   * @param {string} otp Verification OTP
   * @returns {Promise<Object>} Updated profile
   */  updateEmail: async (email, otp) => {
    return api.put('/profile/email/verify-change', { newEmail: email, code: otp });
  },
  
  /**
   * Initiate email change process
   * @param {string} newEmail New email address
   * @returns {Promise<Object>} Response data
   */
  initiateEmailChange: async (newEmail) => {
    return api.post('/profile/email/initiate-change', { newEmail });
  },  /**
   * Get patient feedback/comments from healthcare providers
   * @param {string} profileId - Patient profile ID
   * @returns {Promise<Array>} - Array of feedback items
   */
  getFeedbacks: async (profileId) => {
    try {
      console.log(`Fetching feedbacks for patient ID: ${profileId}`);
      const response = await api.get(`/profile/patient/${profileId}/feedbacks`);
      return response || [];
    } catch (error) {
      console.error('Error fetching patient feedbacks:', error);
      if (error.message && error.message.includes('Network Error')) {
        console.error('This may be a CORS issue or backend connectivity problem');
      }
      throw error;
    }
  },  /**
   * Schedule a new appointment
   * @param {Object} appointmentData Appointment details
   * @returns {Promise<Object>} Scheduled appointment
   */
  scheduleAppointment: async (appointmentData) => {
    return api.post('/profile/patient/appointments', appointmentData);
  },  /**
   * Get all appointments for a patient
   * @param {string} profileId Patient profile ID
   * @returns {Promise<Array>} List of appointments
   */
  getAppointments: async (profileId) => {
    try {
      console.log(`Fetching appointments for patient ID: ${profileId}`);
      const response = await api.get(`/profile/patient/${profileId}/appointments`);
      return response || [];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      if (error.message && error.message.includes('Network Error')) {
        console.error('This may be a CORS issue or backend connectivity problem');
      }
      throw error;
    }
  },  /**
   * Cancel an appointment
   * @param {string} appointmentId Appointment ID
   * @returns {Promise<Object>} Response data
   */
  cancelAppointment: async (appointmentId) => {
    return api.delete(`/profile/patient/appointments/${appointmentId}`);
  }
};

export default patientService;
