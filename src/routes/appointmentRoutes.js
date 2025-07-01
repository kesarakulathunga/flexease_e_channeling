// src/routes/appointmentRoutes.js
const router = require('express').Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');

// Special route to handle the common mistake of accessing /appointments/slots
// This redirects to the proper /slots endpoint
router.get('/slots', (req, res, next) => {
  try {
    // Log the incorrect endpoint access
    console.log(`[WARNING] Deprecated endpoint accessed: /api/appointments/slots - redirecting to /api/slots`);
    
    // Create a query string from the request parameters
    const queryString = Object.keys(req.query).length > 0 
      ? `?${new URLSearchParams(req.query).toString()}` 
      : '';
    
    // For API access, we can't use a redirect as it might break some clients
    // Instead, proxy the request to the time slot controller
    const { getAvailableTimeSlots } = require('../controllers/timeSlotController');
    
    // Log successful redirection
    console.log(`Serving time slots data directly from /api/appointments/slots${queryString}`);
    
    // Pass the request to the time slot controller
    return getAvailableTimeSlots(req, res, next);
  } catch (error) {
    console.error('Error handling slots endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to process time slots request',
      code: 'SLOTS_PROCESSING_ERROR'
    });
  }
});

// Appointment routes
router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);

module.exports = router;