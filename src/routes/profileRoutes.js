// src/routes/profileRoutes.js
const router = require('express').Router();
const {
  getPatientProfile,
  updatePatientBasicInfo,
  initiateEmailChange,
  verifyEmailChange
} = require('../controllers/profileController');
const { authenticate } = require('../middlewares/authenticate');

// All profile routes should be authenticated
router.use(authenticate);

// Profile management routes
router.get('/patient/:id', getPatientProfile);
router.put('/patient/:id', updatePatientBasicInfo);

// Email change routes
router.post('/email/initiate-change', initiateEmailChange);
router.post('/email/verify-change', verifyEmailChange);

module.exports = router;
