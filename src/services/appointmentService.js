// src/services/appointmentService.js
import api from './api';

const appointmentService = {
  /**
   * Get available time slots using the new grid-based API
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date in YYYY-MM-DD format
   * @param {string} params.endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Grid-based time slot data
   */
  getAvailableSlotsGrid: async (params = {}) => {
    try {
      const response = await api.get('/patient/slots/available', { params });
      console.log('GET /patient/slots/available response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching available slots grid:', error);
      throw error;
    }
  },

  /**
   * Update appointments (book, keep, or cancel) using the new API
   * @param {Object} data - Request data
   * @param {Array} data.selectedSlots - Array of selected time slot IDs
   * @returns {Promise<Object>} Updated appointments data
   */
  updateAppointments: async (data) => {
    try {
      console.log('Sending appointment update to API:', data);
      const response = await api.post('/patient/slots/update', data);
      console.log('POST /patient/slots/update response:', response);
      return response;
    } catch (error) {
      console.error('Error updating appointments:', error);
      throw error;
    }
  },

  /**
   * Get available time slots (legacy method)
   * @param {Date} startDate - Start date for slot range
   * @param {Date} endDate - End date for slot range
   * @returns {Promise<Array>} Available time slots
   */
  getAvailableSlots: async (startDate, endDate) => {
    try {
      const response = await api.get('/slots', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  /**
   * Book an appointment (legacy method)
   * @param {number} timeSlotId - ID of the time slot to book
   * @param {string} reason - Reason for the appointment
   * @returns {Promise<Object>} Created appointment
   */
  bookAppointment: async (timeSlotId, reason) => {
    try {
      const response = await api.post('/appointments', {
        timeSlotId,
        reason
      });
      return response;
    } catch (error) {
      console.error('Error booking appointment:', error);
      if (error.response?.status === 409) {
        throw new Error('This time slot is no longer available');
      }
      throw error;
    }
  },

  /**
   * Get appointments for the current patient
   * @returns {Promise<Array>} List of appointments
   */
  getMyAppointments: async () => {
    try {
      // First try the patient-specific endpoint
      try {
        const response = await api.get('/patient/appointments');
        console.log('GET /patient/appointments response:', response);
        return response;
      } catch (err) {
        console.warn('Patient-specific appointments endpoint failed, trying alternative endpoint');
      }

      // If that fails, try the alternative endpoint
      try {
        const response = await api.get('/appointments/my');
        console.log('GET /appointments/my response:', response);
        return response;
      } catch (err) {
        console.warn('Alternative appointments endpoint failed, trying grid API');

        // If both direct methods fail, try to extract appointments from the grid API
        // Generate dates for the next 5 days
        const generateDates = () => {
          const now = new Date();
          const istOffsetMinutes = 330; // +5:30
          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
          const istNow = new Date(utc + istOffsetMinutes * 60000);

          const dates = [];
          for (let i = 0; i < 5; i++) {
            const d = new Date(istNow);
            d.setDate(istNow.getDate() + i);
            dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
          }
          return dates;
        };

        const dates = generateDates();
        const params = { startDate: dates[0], endDate: dates[4] };
        const gridResponse = await api.get('/patient/slots/available', { params });
        console.log('GET /patient/slots/available response:', gridResponse);

        // Extract my appointments from the grid
        const responseData = gridResponse.data || gridResponse;
        const myAppointments = [];

        if (responseData && responseData.grid) {
          const grid = responseData.grid;

          Object.entries(grid).forEach(([date, timeSlots]) => {
            if (!timeSlots) return;

            Object.entries(timeSlots).forEach(([time, slotData]) => {
              if (!slotData) return;

              if (slotData.booked && slotData.myBooking) {
                myAppointments.push({
                  id: slotData.appointmentId || `${date}-${time}`,
                  date,
                  time,
                  doctorName: slotData.doctorName || 'Consultant',
                  status: slotData.status || 'Scheduled'
                });
              }
            });
          });
        }

        return myAppointments;
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  }
};

export default appointmentService;
