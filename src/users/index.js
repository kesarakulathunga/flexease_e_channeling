// src/users/index.js
// Export all user management-related functionality
const patientController = require('./patientController');
const adminController = require('./adminController');
const patientRoutes = require('./patientRoutes');
const adminRoutes = require('./adminRoutes');

module.exports = {
  patientController,
  adminController,
  patientRoutes,
  adminRoutes
};