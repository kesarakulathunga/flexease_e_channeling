// src/users/adminRoutes.js
const router = require('express').Router();
const {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getAdminEmails
} = require('./adminController');

// Admin emails endpoint - this returns only email addresses for admin accounts
router.get('/emails', getAdminEmails);

// CRUD routes for admin management
router.post('/', createAdmin);
router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;