// src/routes/publicSlotRoutes.js
const router = require('express').Router();
const { getPublicAvailableSlots } = require('../controllers/patientSlotController');

// Public time slot routes (no authentication required)
router.get('/slots/available', getPublicAvailableSlots);

module.exports = router;
