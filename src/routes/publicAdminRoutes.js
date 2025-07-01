// src/routes/publicAdminRoutes.js
const router = require('express').Router();
const { prisma } = require('../config');

// Public endpoint to get all admin emails
router.get('/admin-emails', async (req, res, next) => {
  try {
    const admins = await prisma.adminProfile.findMany({
      select: {
        id: true,
        email: true
      }
    });
    res.json(admins);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
