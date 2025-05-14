// src/middlewares/authenticate.js
const { authenticateJWT } = require('./authMiddleware');

// This exports the same function with a different name for better semantics
// when used in routes that should be protected
const authenticate = authenticateJWT;

module.exports = { authenticate };
