// src/middlewares/roleMiddleware.js
exports.authorize = (requiredRole) => (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.sendStatus(403);
    }
    next();
  };
  