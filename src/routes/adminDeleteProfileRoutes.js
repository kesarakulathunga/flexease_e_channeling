// src/routes/adminDeleteProfileRoutes.js
const router = require('express').Router();
const { deleteUserProfile } = require('../controllers/adminProfileController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require admin authentication
router.use(authenticateJWT);
router.use(authorize('ADMIN'));

// DELETE /admin/profiles/:email - Delete a user profile by email (URL encoded)
router.delete('/:email', deleteUserProfile);

module.exports = router;
