// src/routes/reportRoutes.js
const router = require('express').Router();
const {
  uploadReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} = require('../controllers/reportController');

// Report routes
router.post('/', uploadReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

module.exports = router;