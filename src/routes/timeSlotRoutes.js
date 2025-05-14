// src/routes/timeSlotRoutes.js
const router = require('express').Router();
const {
  createTimeSlots,
  getAvailableTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot
} = require('../controllers/timeSlotController');

// Time slot routes
router.post('/', createTimeSlots);
router.get('/', getAvailableTimeSlots);
router.get('/:id', getTimeSlotById);
router.put('/:id', updateTimeSlot);
router.delete('/:id', deleteTimeSlot);

module.exports = router;