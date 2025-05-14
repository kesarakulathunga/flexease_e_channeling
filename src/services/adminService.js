// src/services/adminService.js
import api from './api';

const adminService = {
  /**
   * Get all admin users
   * @returns {Promise<Array>} List of admin users
   */
  getAdmins: async () => {
    return api.get('/admin/users');
  },

  /**
   * Add a new admin
   * @param {string} email Admin email
   * @returns {Promise<Object>} Created admin
   */
  addAdmin: async (email) => {
    return api.post('/admin/users', { email });
  },

  /**
   * Remove an admin
   * @param {string} email Admin email
   * @returns {Promise<Object>} Response data
   */
  removeAdmin: async (email) => {
    return api.delete(`/admin/users/${encodeURIComponent(email)}`);
  },

  /**
   * Update available time slots
   * @param {Array} slots Array of slot objects
   * @returns {Promise<Object>} Updated slots
   */
  updateTimeSlots: async (slots) => {
    return api.post('/admin/slots', { slots });
  },

  /**
   * Get all available time slots
   * @returns {Promise<Array>} List of time slots
   */
  getTimeSlots: async () => {
    return api.get('/admin/slots');
  },
  /**
   * Get all patient reports for review
   * @param {string} status Filter by status ('unreviewed' or 'reviewed')
   * @returns {Promise<Array>} List of reports
   */
  getReports: async (status = '') => {
    return api.get('/admin/reports', { 
      params: status ? { status } : {} 
    });
  },

  /**
   * Get all patient reports (alias for getReports)
   * @returns {Promise<Array>} List of all reports
   */
  getAllReports: async () => {
    return api.get('/admin/reports');
  },

  /**
   * Add feedback to a report
   * @param {string} reportId Report ID
   * @param {string} feedback Feedback content
   * @returns {Promise<Object>} Updated report
   */
  addReportFeedback: async (reportId, feedback) => {
    return api.post(`/admin/reports/${reportId}/feedback`, { feedback });
  },

  /**
   * Delete feedback from a report
   * @param {string} reportId Report ID
   * @param {string} feedbackId Feedback ID
   * @returns {Promise<Object>} Updated report
   */
  deleteReportFeedback: async (reportId, feedbackId) => {
    return api.delete(`/admin/reports/${reportId}/feedback/${feedbackId}`);
  },

  /**
   * Delete an admin profile (self)
   * @returns {Promise<Object>} Response data
   */
  deleteAdminProfile: async () => {
    return api.delete('/admin/me');
  }
};

export default adminService;
