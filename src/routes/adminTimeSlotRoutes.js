// src/routes/adminTimeSlotRoutes.js
const router = require('express').Router();

// This is a placeholder for admin time slot routes
// The original functionality has been removed and will be reimplemented
// All routes will return a message indicating the feature is being rebuilt

router.get('*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Admin slot functionality is currently being rebuilt. Please check back later.',
    code: 'ADMIN_SLOTS_REBUILDING'
  });
});

router.post('*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Admin slot functionality is currently being rebuilt. Please check back later.',
    code: 'ADMIN_SLOTS_REBUILDING'
  });
});

router.put('*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Admin slot functionality is currently being rebuilt. Please check back later.',
    code: 'ADMIN_SLOTS_REBUILDING'
  });
});

router.delete('*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Admin slot functionality is currently being rebuilt. Please check back later.',
    code: 'ADMIN_SLOTS_REBUILDING'
  });
});

module.exports = router;
