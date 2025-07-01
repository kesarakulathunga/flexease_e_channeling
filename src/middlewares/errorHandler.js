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
  // Prevent application from crashing on uncaught errors
  try {
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
    
    // Handle Prisma specific errors
    if (err.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        error: {
          message: 'Invalid request data',
          details: process.env.NODE_ENV !== 'production' ? err.message : 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      });
    }
    
    if (err.name === 'PrismaClientKnownRequestError') {
      // Handle common Prisma errors
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: {
            message: 'Duplicate entry error',
            details: process.env.NODE_ENV !== 'production' ? `Unique constraint violation on ${err.meta?.target}` : 'Resource already exists',
            code: 'DUPLICATE_RESOURCE'
          }
        });
      }
      if (err.code === 'P2025') {
        return res.status(404).json({
          error: {
            message: 'Resource not found',
            details: process.env.NODE_ENV !== 'production' ? err.meta?.cause : 'The requested resource does not exist',
            code: 'RESOURCE_NOT_FOUND'
          }
        });
      }
      // Handle foreign key constraint errors
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: {
            message: 'Invalid reference',
            details: process.env.NODE_ENV !== 'production' ? `Foreign key constraint failed on field ${err.meta?.field_name}` : 'Referenced resource does not exist',
            code: 'INVALID_REFERENCE'
          }
        });
      }
    }
    
    // Handle TypeErrors which often indicate bugs in the code
    if (err instanceof TypeError) {
      logger.error(`Type Error detected: ${err.message}`, { stack: err.stack });
      return res.status(500).json({
        error: {
          message: 'Internal server error',
          details: process.env.NODE_ENV !== 'production' ? err.message : 'An unexpected error occurred',
          code: 'TYPE_ERROR'
        }
      });
    }
    
    // Handle SyntaxErrors
    if (err instanceof SyntaxError) {
      return res.status(400).json({
        error: {
          message: 'Invalid request syntax',
          details: process.env.NODE_ENV !== 'production' ? err.message : 'The request contains invalid syntax',
          code: 'SYNTAX_ERROR'
        }
      });
    }
    
    // Determine HTTP status code
    const statusCode = err.status || 500;
    
    // Format the response
    const errorResponse = {
      error: {
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR'
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
  } catch (handlerError) {
    // If the error handler itself fails, log it and send a basic error response
    console.error('Error in error handler:', handlerError);
    res.status(500).json({ 
      error: {
        message: 'Internal Server Error',
        details: 'An unexpected error occurred while processing your request'
      }
    });
  }
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
  