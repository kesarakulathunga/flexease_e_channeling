// src/routes/adminUserRoutes.js
const router = require('express').Router();
const { 
  getAllAdminUsers, 
  addAdminUser, 
  removeAdminUser 
} = require('../controllers/adminUserController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require admin authentication
router.use(authenticateJWT);
router.use(authorize('ADMIN'));

// GET /admin/users - Get all admin users
router.get('/', getAllAdminUsers);

// POST /admin/users - Add a new admin user
router.post('/', addAdminUser);

// DELETE /admin/users/:email - Remove admin privileges
router.delete('/:email', removeAdminUser);

module.exports = router;
