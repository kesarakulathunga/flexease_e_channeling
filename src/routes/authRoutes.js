// src/routes/authRoutes.js
const router = require('express').Router();
const { 
  sendOtp, 
  verifyOtp, 
  logout, 
  checkEmailAndSendOtp, 
  verifyEmailOtp,
  selectAccount
} = require('../controllers/authController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// health inside the router
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// New endpoints for appointment flow
router.post('/check-email', checkEmailAndSendOtp);
router.post('/verify-email', verifyEmailOtp);
router.post('/select-account', selectAccount);

// Existing endpoints
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', authenticateJWT, logout);

module.exports = router;
