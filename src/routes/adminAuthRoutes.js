// src/routes/adminAuthRoutes.js
const router = require('express').Router();
const { 
  checkAdminEmailAndSendOtp,
  verifyAdminOtp,
  adminLogout
} = require('../controllers/adminAuthController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Admin login routes
router.post('/check-admin-email', checkAdminEmailAndSendOtp);
router.post('/verify-admin-otp', verifyAdminOtp);
router.post('/admin-logout', authenticateJWT, adminLogout);

module.exports = router;
