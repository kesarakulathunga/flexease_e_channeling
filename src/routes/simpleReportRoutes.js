// src/routes/simpleReportRoutes.js
const router = require('express').Router();
const {
  getAllReports,
  deleteReportFile
} = require('../controllers/simpleReportController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Apply authentication to all routes
router.use(authenticateJWT);

// Simple report routes
router.get('/all', getAllReports); // Get all reports
router.delete('/:id', deleteReportFile); // Delete a report and its file

module.exports = router;
