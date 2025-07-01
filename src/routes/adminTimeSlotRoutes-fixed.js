// src/routes/adminTimeSlotRoutes.js
const router = require('express').Router();
const adminTimeSlotController = require('../controllers/adminTimeSlotController');

// All routes now have authentication and authorization handled at the app level
// with the flexible auth middleware

// Admin time slot routes
router.put('/availability', adminTimeSlotController.updateAvailability);
router.get('/', adminTimeSlotController.getAdminTimeSlots);
router.get('/debug', adminTimeSlotController.getAdminTimeSlotsDebug);
router.post('/', adminTimeSlotController.updateTimeSlots);
router.post('/bulk', adminTimeSlotController.createBulkTimeSlots);

module.exports = router;
