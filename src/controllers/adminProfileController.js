// src/controllers/adminProfileController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Delete a user profile by email
 * This allows administrators to remove a user profile completely, including:
 * - User record
 * - Patient or Admin profile
 * - Related data (OTPs, sessions, etc.)
 */
exports.deleteUserProfile = async (req, res, next) => {
  try {
    const email = decodeURIComponent(req.params.email);
    
    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email parameter is required'
      });
    }
    
    // Find the user to check if they exist and get their role
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User with this email does not exist'
      });
    }
    
    // Prevent deleting yourself
    const requestingAdmin = req.user;
    if (requestingAdmin.email === email) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot delete your own account'
      });
    }
    
    // Begin transaction to delete all related records
    const result = await prisma.$transaction(async (prisma) => {
      let deletedProfile;
      
      // Delete profile based on user role
      if (user.role === 'ADMIN') {
        // Delete admin profile
        deletedProfile = await prisma.adminProfile.deleteMany({
          where: { email }
        });
      } else if (user.role === 'PATIENT') {
        // Delete patient profile
        deletedProfile = await prisma.patientProfile.deleteMany({
          where: { email }
        });
        
        // Delete related appointments
        await prisma.appointment.deleteMany({
          where: { patientId: user.id }
        });
        
        // Delete related reports
        await prisma.report.deleteMany({
          where: { patientId: user.id }
        });
      }
      
      // Delete OTPs for this email
      await prisma.oTP.deleteMany({
        where: { email }
      });
      
      // Delete sessions for this user
      await prisma.session.deleteMany({
        where: { userId: user.id }
      });
      
      // Finally, delete the user
      const deletedUser = await prisma.user.delete({
        where: { id: user.id }
      });
      
      return {
        deletedUser,
        deletedProfile,
        role: user.role
      };
    });
      logger.info(`Admin ${requestingAdmin.email} deleted profile for ${email}`);
    
    // Return 204 No Content as specified in requirements
    return res.status(204).end();
    
  } catch (err) {
    logger.error(`Error deleting user profile: ${err.message}`, { stack: err.stack });
    next(err);
  }
};
