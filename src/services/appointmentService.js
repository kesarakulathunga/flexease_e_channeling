// src/services/appointmentService.js
import api from './api';

const appointmentService = {
  /**
   * Get available appointment slots
   * @param {Object} params Query parameters (date range, etc)
   * @returns {Promise<Array>} List of available slots
   */
  getAvailableSlots: async (params = {}) => {
    return api.get('/appointments/slots', { params });
  },

  /**
   * Book an appointment
   * @param {Object} appointmentData Appointment details
   * @returns {Promise<Object>} Booked appointment
   */
  bookAppointment: async (appointmentData) => {
    return api.post('/appointments', appointmentData);
  },

  /**
   * Get patient's appointments
   * @returns {Promise<Array>} List of appointments
   */
  getMyAppointments: async () => {
    return api.get('/appointments/patient');
  },
  /**
   * Reschedule an appointment
   * @param {string} appointmentId Appointment ID
   * @param {Object} newSlot New appointment slot details
   * @returns {Promise<Object>} Updated appointment
   */
  rescheduleAppointment: async (appointmentId, newSlot) => {
    return api.put(`/appointments/${appointmentId}/reschedule`, newSlot);
  },  /**
   * Cancel an appointment
   * @param {string} appointmentId Appointment ID
   * @returns {Promise<Object>} Cancellation result
   */
  cancelAppointment: async (appointmentId) => {
    return api.delete(`/appointments/${appointmentId}`);
  },
    /**
   * Verify OTP for appointment flow
   * @param {string} email The user's email
   * @param {string} otp The OTP code
   * @returns {Promise<Object>} Verification result
   */  verifyAppointmentOTP: async (email, otp) => {
    try {
      console.log(`Verifying OTP for appointment flow: ${email}`);
      
      // Validate parameters to avoid common issues
      if (!email || typeof email !== 'string') {
        throw new Error('Email is required and must be a string');
      }
      
      if (!otp || typeof otp !== 'string') {
        throw new Error('OTP is required and must be a string');
      }
      
      // Make sure the OTP is exactly 6 digits
      const otpTrimmed = otp.trim();
      if (!/^\d{6}$/.test(otpTrimmed)) {
        throw new Error('OTP must be exactly 6 digits');
      }
      
      // Explicitly use purpose='registration' for appointment flow
      const purpose = 'registration';
      console.log(`Using purpose '${purpose}' for appointment OTP verification`);
      
      const data = { 
        email: email.trim(), 
        otp: otpTrimmed, 
        purpose 
      };
      console.log('Sending OTP verification data:', data);
      
      // Make the API call with clear purpose parameter
      const response = await api.post('/auth/verify-email', data);
      console.log('Appointment OTP verification successful:', response);
      
      // Handle the token if it exists
      if (response.token) {
        console.log('Setting auth token from appointment OTP verification:', response.token.substring(0, 10) + '...');
        localStorage.setItem('authToken', response.token);
        
        // Handle user data
        if (response.user) {
          console.log('Storing user data from OTP verification:', response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('userRole', 'PATIENT');
        } else {
          console.log('Creating basic user data from email:', email);
          localStorage.setItem('user', JSON.stringify({ email }));
          localStorage.setItem('userRole', 'PATIENT');
        }
        
        // Dispatch event to notify auth context
        window.dispatchEvent(new Event('storage:authchange'));
      }
      
      // Transform the response to have a consistent structure
      const transformedResponse = {
        ...response,
        // Make sure we have a profiles array, normalizing from various response formats
        profiles: response.profiles || response.patients || [],
        // Track if we found existing accounts
        hasExistingAccounts: !!(response.profiles?.length || response.patients?.length || false)
      };
      
      return transformedResponse;    } catch (error) {
      console.error('Error in verifyAppointmentOTP:', error);
      
      if (error.response) {
        console.error('Server error in appointment OTP verification:', error.response.data);
        
        if (error.response.status === 400) {
          const errorMessage = error.response.data?.message || '';
          console.error(`Bad request (400) details: ${errorMessage}`);
          
          if (errorMessage.toLowerCase().includes('invalid') && 
              errorMessage.toLowerCase().includes('otp')) {
            console.error('OTP validation failed - likely expired or incorrect OTP');
          } else if (errorMessage.toLowerCase().includes('purpose')) {
            console.error('Purpose parameter issue detected. Ensure purpose=registration is sent.');
          }
        } else if (error.response.status === 401) {
          console.error('Invalid or expired OTP for appointment flow.');
        }
      }
      
      throw error;
    }
  }
};

export default appointmentService;
