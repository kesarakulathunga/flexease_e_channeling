// src/routes/adminMeRoutes.js
const router = require('express').Router();
const { deleteAdminProfile } = require('../controllers/adminProfileMeController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require admin authentication
router.use(authenticateJWT);
router.use(authorize('ADMIN'));

// DELETE /api/admin/me - Delete the admin's own profile
router.delete('/', deleteAdminProfile);

module.exports = router;
