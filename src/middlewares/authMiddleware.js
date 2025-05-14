// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { findActiveSession } = require('../auth/sessionService');

exports.authenticateJWT = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.sendStatus(401);

    const payload = jwt.verify(token, JWT_SECRET);
    const session = await findActiveSession(token);
    if (!session) return res.sendStatus(401);

    req.user = payload;
    req.token = token;
    next();
  } catch {
    return res.sendStatus(403);
  }
};
