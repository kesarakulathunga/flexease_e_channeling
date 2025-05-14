// src/routes/appointmentRoutes.js
const router = require('express').Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');

// Appointment routes
router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);

module.exports = router;