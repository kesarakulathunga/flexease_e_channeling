// src/routes/reportRoutes.js
const router = require('express').Router();
const {
  uploadReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} = require('../controllers/reportController');
const { uploadReportFile } = require('../utils/fileUploadUtil');

// Report routes
router.post('/', uploadReportFile('reportFile'), uploadReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.put('/:id', uploadReportFile('reportFile'), updateReport);
router.delete('/:id', deleteReport);

module.exports = router;