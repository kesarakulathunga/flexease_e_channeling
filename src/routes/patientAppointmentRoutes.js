// src/routes/patientAppointmentRoutes.js
const router = require('express').Router();
const {
  bookPatientAppointment,
  getPatientAppointments,
  cancelPatientAppointment
} = require('../controllers/patientAppointmentController');

// GET /api/patient/appointments - Get all appointments for the logged in patient
router.get('/', getPatientAppointments);

// POST /api/patient/appointments - Book a new appointment
router.post('/', bookPatientAppointment);

// PUT /api/patient/appointments/:id/cancel - Cancel an appointment
router.put('/:id/cancel', cancelPatientAppointment);

module.exports = router;
