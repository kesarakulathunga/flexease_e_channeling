// src/services/adminService.js
const { prisma } = require('../config');

/**
 * Get all admin emails
 * @returns {Promise<Array>} Array of admin emails
 */
exports.getAllAdminEmails = async () => {
  try {
    const admins = await prisma.adminProfile.findMany({
      select: {
        id: true,
        email: true
      }
    });
    return admins;
  } catch (error) {
    console.error('Error retrieving admin emails:', error);
    throw error;
  }
};

/**
 * Create a new admin
 * @param {Object} adminData - Data for the new admin
 * @returns {Promise<Object>} Created admin object
 */
exports.createAdmin = async (adminData) => {
  const { email, fullName, specialty, phone } = adminData;
  
  try {
    // Create admin profile
    const admin = await prisma.adminProfile.create({
      data: { 
        email, 
        fullName, 
        specialty, 
        phone 
      }
    });
    
    // Ensure there's a corresponding user record with ADMIN role
    await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: { 
        email, 
        role: 'ADMIN' 
      }
    });
    
    return admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};