// src/routes/adminReportRoutes.js
const router = require('express').Router();
const {
  getReportsWithoutFeedback,
  addFeedbackToReport,
  getReportFeedback,
  getAllReportsWithPatientDetails,
  deleteReport,
  getReportCount,
  searchReportsByPatientEmail
} = require('../controllers/adminReportController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Middleware to ensure user is an admin
const ensureAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized',
      message: 'This endpoint is only available to administrators'
    });
  }
  next();
};

// Apply admin authentication to all routes
router.use(authenticateJWT);
router.use(ensureAdmin);

// Admin-specific report routes
router.get('/', getAllReportsWithPatientDetails); // Main route to get all reports
router.get('/pending-feedback', getReportsWithoutFeedback); // Keep for backward compatibility
router.post('/:id/feedback', addFeedbackToReport); // Add feedback
router.delete('/:id', deleteReport); // Delete a report
router.get('/feedback', getReportFeedback); // For viewing feedback history
router.get('/allreports', getAllReportsWithPatientDetails); // New route for all reports (alias)
router.get('/count', getReportCount); // Get total count of reports
router.get('/search', searchReportsByPatientEmail); // Search reports by patient email

module.exports = router;
