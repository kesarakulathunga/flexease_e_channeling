// src/routes/patientSlotRoutes.js
const router = require('express').Router();
const { getAvailableSlotsForPatients, getPublicAvailableSlots } = require('../controllers/patientSlotController');

// Patient-facing time slot routes
router.get('/available', getAvailableSlotsForPatients);

module.exports = router;
