// src/middlewares/errorHandler.js
const logger = require('../utils/logger');

// Custom error class for API errors
class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error with relevant request details
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    userRole: req.user?.role,
    error: err.message,
    stack: err.stack
  };
  
  // Add request body for non-GET requests (avoid logging sensitive data)
  if (req.method !== 'GET' && !req.originalUrl.includes('/auth/')) {
    logData.body = req.body;
  }
  
  logger.error(`API Error: ${err.message}`, logData);
  
  // Determine HTTP status code
  const statusCode = err.status || 500;
  
  // Format the response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error'
    }
  };
  
  // Include error details in development
  if (process.env.NODE_ENV !== 'production' && err.details) {
    errorResponse.error.details = err.details;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Helper function to create standard errors
const createError = (status, message, details = null) => {
  return new ApiError(status, message, details);
};

module.exports = {
  errorHandler,
  createError,
  ApiError
};
  