// src/routes/profileRoutes.js
const router = require('express').Router();
const {
  getPatientProfile,
  updatePatientBasicInfo,
  initiateEmailChange,
  verifyEmailChange,
  deletePatientProfile
} = require('../controllers/profileController');
const { authenticate } = require('../middlewares/authenticate');

// All profile routes should be authenticated
router.use(authenticate);

// Profile management routes
router.get('/patient/:id', getPatientProfile);
router.put('/patient/:id', updatePatientBasicInfo);
router.delete('/patient/:id', deletePatientProfile);

// Frontend-compatible alternative routes
router.put('/me', (req, res, next) => {
  // For the /me endpoint, use the patientId from the authenticated user
  req.params.id = req.user.patientId;
  updatePatientBasicInfo(req, res, next);
});

router.put('/profiles/:id', updatePatientBasicInfo);

// Email change routes
router.post('/email/initiate-change', initiateEmailChange);
router.post('/email/verify-change', verifyEmailChange);

module.exports = router;
