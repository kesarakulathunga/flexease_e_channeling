// src/controllers/adminAuthController.js
const jwt = require('jsonwebtoken');
const { prisma, JWT_SECRET } = require('../config');
const { sendOtp, verifyOtp } = require('../services/enhancedOtpService');
const { createSession, invalidateSession } = require('../services/sessionService');
const logger = require('../utils/logger');

// Check if email is an admin email and send OTP
exports.checkAdminEmailAndSendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if a user with this email exists and has admin role
    const admin = await prisma.user.findFirst({
      where: { 
        email,
        role: 'ADMIN'
      }
    });
    
    // If no admin exists with this email, return error
    if (!admin) {
      return res.status(404).json({ 
        error: 'Your email is not registered as an admin user.',
        emailExists: false,
        isAdmin: false
      });
    }
    
    // Send OTP with admin_login purpose
    await sendOtp(email, 'LOGIN', null, 'admin_login');
    logger.info(`Admin login OTP sent to ${email}`);
    
    // Get admin profile information
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { email }
    });
    
    // Return admin info
    res.json({ 
      emailExists: true,
      isAdmin: true,
      admin: {
        id: admin.id,
        email: admin.email,
        profileId: adminProfile?.id,
      },
      message: 'OTP sent'
    });
  } catch (err) {
    logger.error(`Error in admin login process: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

// Verify admin OTP and issue token
exports.verifyAdminOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    
    // Validate inputs
    if (!email || !code) {
      return res.status(400).json({ 
        verified: false,
        error: 'Email and verification code are required' 
      });
    }
    
    // Verify OTP is valid
    try {
      await verifyOtp(email, code, 'LOGIN', null, 'admin_login');
      
      // Get admin user info
      const admin = await prisma.user.findFirst({
        where: { email, role: 'ADMIN' }
      });
      
      if (!admin) {
        return res.status(404).json({ 
          verified: false,
          error: 'Admin user not found' 
        });
      }
      
      // Get admin profile
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { email }
      });
      
      // Create JWT payload
      const payload = { 
        email, 
        role: 'ADMIN', 
        userId: admin.id 
      };
      
      // Sign token & persist session
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const expiresAt = new Date(Date.now() + 24*60*60*1000); // 24 hours
      await createSession({ userId: admin.id, token, expiresAt });
      
      logger.info(`Admin login successful: ${email}`);
      
      // Return success response with token and admin info
      res.json({ 
        verified: true,
        token,
        role: 'ADMIN',
        admin: {
          id: admin.id,
          email: admin.email,
          profileId: adminProfile?.id,
          createdAt: adminProfile?.createdAt
        },
        message: 'Admin authenticated successfully'
      });
    } catch (error) {
      logger.warn(`Admin OTP verification failed: ${error.message}`);
      return res.status(400).json({ 
        verified: false, 
        message: 'Invalid or expired verification code' 
      });
    }
  } catch (err) {
    logger.error(`Error in admin OTP verification: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

// Admin logout
exports.adminLogout = async (req, res, next) => {
  try {
    const token = req.token; // attached by authMiddleware
    await invalidateSession(token);
    logger.info(`Admin logged out: ${req.user.email}`);
    res.json({ message: 'Admin logged out successfully' });
  } catch (err) {
    logger.error(`Error in admin logout: ${err.message}`, { stack: err.stack });
    next(err);
  }
};
