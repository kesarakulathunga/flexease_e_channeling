// src/controllers/adminAvailabilityController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Placeholder for admin availability functionality
 * This functionality is being rebuilt
 */
const placeholderResponse = (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Admin availability functionality is currently being rebuilt. Please check back later.',
    code: 'ADMIN_SLOTS_REBUILDING'
  });
};

// Placeholder functions for all exported methods
exports.getAdminTimeSlots = placeholderResponse;
exports.updateAdminAvailability = placeholderResponse;
exports.getMyAvailability = placeholderResponse;
exports.getAdminAvailability = placeholderResponse;
