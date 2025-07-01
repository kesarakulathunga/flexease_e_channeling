// src/auth/devOtpController.js
const { prisma } = require('../config');

// FOR DEVELOPMENT USE ONLY - Should be disabled in production
exports.getLatestOtpForEmail = async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is not available in production' });
  }
  
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    const latestOtp = await prisma.oTP.findFirst({
      where: { 
        email,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!latestOtp) {
      return res.status(404).json({ error: 'No valid OTP found for this email' });
    }
    
    res.json({ 
      email: latestOtp.email,
      code: latestOtp.code,
      purpose: latestOtp.purpose,
      expiresAt: latestOtp.expiresAt
    });
  } catch (error) {
    console.error('Error retrieving OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
