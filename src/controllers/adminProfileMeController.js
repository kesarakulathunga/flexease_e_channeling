// src/controllers/adminProfileMeController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Delete the admin's own profile
 * This allows administrators to initiate deletion of their own profile through the /me endpoint
 */
exports.deleteAdminProfile = async (req, res, next) => {
  try {
    // Get the authenticated admin's email from the request
    const adminEmail = req.user.email;
    
    if (!adminEmail) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Admin email not found in authentication data'
      });
    }
    
    // Check if admin exists
    const admin = await prisma.user.findFirst({
      where: { 
        email: adminEmail,
        role: 'ADMIN'
      }
    });
    
    if (!admin) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Admin profile not found'
      });
    }
    
    // Begin transaction to delete admin profile
    const result = await prisma.$transaction(async (prisma) => {
      // Delete admin profile
      const deletedProfile = await prisma.adminProfile.deleteMany({
        where: { email: adminEmail }
      });
      
      // Delete OTPs for this email
      await prisma.oTP.deleteMany({
        where: { email: adminEmail }
      });
      
      // Delete sessions for this user
      await prisma.session.deleteMany({
        where: { userId: admin.id }
      });
      
      // Change user role or delete the user (depending on your requirements)
      // Option 1: Change role
      const updatedUser = await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'PATIENT' }
      });
      
      // Option 2: Delete user completely (uncomment if you want this behavior)
      /*
      const deletedUser = await prisma.user.delete({
        where: { id: admin.id }
      });
      */
      
      return {
        updatedUser,
        deletedProfile
      };
    });
    
    logger.info(`Admin ${adminEmail} deleted their own profile`);
    
    // Return 204 No Content as specified in requirements
    return res.status(204).end();
    
  } catch (err) {
    logger.error(`Error deleting admin profile: ${err.message}`, { stack: err.stack });
    next(err);
  }
};
