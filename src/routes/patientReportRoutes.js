// src/routes/patientReportRoutes.js
const router = require('express').Router();
const {
  uploadReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} = require('../controllers/reportController');
const { getReportFeedback } = require('../controllers/patientFeedbackController');
const { uploadReportFile } = require('../utils/fileUploadUtil');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Middleware to ensure user is a patient
const ensurePatient = (req, res, next) => {
  if (!req.user || !req.user.patientId) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized',
      message: 'This endpoint is only available to patients'
    });
  }
  next();
};

// Patient-specific report routes - apply authentication middleware to all routes
router.use(authenticateJWT, ensurePatient);

router.post('/reports', uploadReportFile('reportFile'), uploadReport);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.get('/reports/:id/feedback', getReportFeedback); // NEW: Get feedback for a specific report
router.put('/reports/:id', uploadReportFile('reportFile'), updateReport);
router.delete('/reports/:id', deleteReport);

module.exports = router;
