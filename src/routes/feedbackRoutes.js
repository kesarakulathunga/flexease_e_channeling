// src/routes/feedbackRoutes.js
const router = require('express').Router();
const {
  addFeedback,
  getFeedbackByReport,
  getFeedbackByAdmin,
  getFeedbackById,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

// Feedback routes
router.post('/', addFeedback);
router.get('/', (req, res, next) => {
  // Route handler that determines which controller method to use based on query parameters
  if (req.query.reportId) {
    return getFeedbackByReport(req, res, next);
  } else if (req.query.adminId) {
    return getFeedbackByAdmin(req, res, next);
  } else {
    return res.status(400).json({ error: 'Either reportId or adminId query parameter is required' });
  }
});
router.get('/:id', getFeedbackById);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

module.exports = router;