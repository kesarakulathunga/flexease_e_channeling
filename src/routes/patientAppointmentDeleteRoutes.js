// src/routes/patientAppointmentDeleteRoutes.js
const router = require('express').Router();
const { deleteAllPatientAppointments } = require('../controllers/patientAppointmentDeleteController');

/**
 * @route POST /api/patient-appointments/delete-all
 * @desc Delete all appointments for a specific patient ID
 * @access Public - No authentication required for this specific endpoint
 */
router.post('/delete-all', deleteAllPatientAppointments);

module.exports = router;
