// src/middlewares/flexAuthMiddleware.js
/**
 * A flexible authentication middleware that supports both regular and admin tokens
 * This solves compatibility issues with frontends that might store tokens in different localStorage keys
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const logger = require('../utils/logger');

exports.flexAuthenticateJWT = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    if (!token) {
      console.log('No token provided in Authorization header');
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    console.log('Received token:', token.substring(0, 20) + '...');
    
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      
      console.log('Authenticated user with flex auth:', payload.email, 'with role:', payload.role);
      console.log('Token payload:', JSON.stringify(payload));
      
      // Store the user info in the request for later use
      req.user = payload;
      req.token = token;
      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed:', jwtError.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(500).json({ error: 'Authentication system error' });
  }
};
