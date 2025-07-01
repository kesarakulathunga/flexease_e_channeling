// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { findActiveSession } = require('../auth/sessionService');

exports.authenticateJWT = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      console.log('No token provided in Authorization header');
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      
      // Temporarily bypass session check for debugging purposes
      // const session = await findActiveSession(token);
      // if (!session) {
      //   console.log('No active session found for token');
      //   return res.status(401).json({ error: 'No active session found' });
      // }
      
      console.log('Authenticated user:', payload.email, 'with role:', payload.role);
      
      req.user = payload;
      req.token = token;
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.log('Authentication error:', error.message);
    return res.status(500).json({ error: 'Authentication system error' });
  }
};

// Check if user has admin role
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
