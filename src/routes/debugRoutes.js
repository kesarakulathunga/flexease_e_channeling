// src/routes/debugRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const router = express.Router();

// Debug route to check token
router.get('/check-token', (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      return res.json({
        success: true,
        message: 'Token is valid',
        tokenInfo: {
          userId: decoded.userId,
          role: decoded.role,
          email: decoded.email,
          expiration: new Date(decoded.exp * 1000).toISOString()
        }
      });
    } catch (jwtError) {
      return res.status(403).json({ error: 'Invalid token', details: jwtError.message });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Echo the request body and headers for debugging
router.post('/echo', (req, res) => {
  return res.json({
    success: true,
    message: 'Echo response',
    requestBody: req.body,
    requestHeaders: req.headers
  });
});

module.exports = router;
