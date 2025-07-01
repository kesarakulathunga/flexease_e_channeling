// src/routes/adminProfileRoutes.js
const router = require('express').Router();
const { deleteUserProfile } = require('../controllers/adminProfileController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require admin authentication
router.use(authenticateJWT);
router.use(authorize('ADMIN'));

// DELETE /api/admin/profiles/:email - Delete a user profile by email
router.delete('/:email', deleteUserProfile);

module.exports = router;
