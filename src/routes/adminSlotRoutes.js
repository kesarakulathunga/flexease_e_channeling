// src/routes/adminSlotRoutes.js
const router = require('express').Router();
const {
  getAdminMarkedSlots,
  updateAdminAvailability,
  getAdminAvailabilityCount
} = require('../controllers/adminSlotController');

// Get all slots marked by the current admin
router.get('/marked', getAdminMarkedSlots);

// Update admin's availability based on selected slots
router.post('/update', updateAdminAvailability);

// Get count of availability slots for each admin for the current month
router.get('/availability-count', getAdminAvailabilityCount);

module.exports = router;
