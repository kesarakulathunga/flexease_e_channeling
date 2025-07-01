// src/routes/patientSlotRoutes2.js
const router = require('express').Router();
const { 
  getAvailableSlots,
  updateAppointments
} = require('../controllers/patientAppointmentController2');

// Get all available slots and patient's existing appointments
router.get('/available', getAvailableSlots);

// Update patient's appointments (book new ones, keep existing ones, cancel others)
router.post('/update', updateAppointments);

module.exports = router;
