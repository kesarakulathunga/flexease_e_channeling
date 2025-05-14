// src/auth/index.js
// Export all authentication-related functionality
const authController = require('./authController');
const authRoutes = require('./authRoutes');
const otpService = require('./otpService');
const sessionService = require('./sessionService');

module.exports = {
  authController,
  authRoutes,
  otpService,
  sessionService
};