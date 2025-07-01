// src/controllers/adminUserController.js
const { prisma } = require('../config');

// 1. Get all admin users (for frontend display)
exports.getAllAdminUsers = async (req, res, next) => {
  try {
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        email: true
      }
    });
    
    // Format exactly as frontend expects
    res.status(200).json(adminUsers);
  } catch (err) {
    next(err);
  }
};

// 2. Add a new admin user by email
exports.addAdminUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        message: 'Please provide an email address'
      });
    }
    
    // Check if email already exists as admin
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email,
        role: 'ADMIN'
      }
    });
    
    if (existingAdmin) {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'This email already has admin privileges' 
      });
    }
    
    // Check if the email exists as a user already
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
      if (existingUser) {
      // Promote existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });
      
      // Create an admin profile entry
      const adminProfile = await prisma.adminProfile.create({
        data: { 
          email
        }
      });
      
      return res.status(201).json({ 
        message: 'User promoted to admin successfully',
        admin: {
          id: updatedUser.id,
          email: updatedUser.email
        }
      });
    } else {
      // Email doesn't exist in system - create a new user with admin role
      const [newUser, adminProfile] = await prisma.$transaction([
        // Create the user with ADMIN role
        prisma.user.create({
          data: {
            email,
            role: 'ADMIN'
          }
        }),
        
        // Create admin profile
        prisma.adminProfile.create({
          data: { 
            email
          }
        })
      ]);
      
      return res.status(201).json({ 
        message: 'New admin user created successfully',
        admin: {
          id: newUser.id,
          email: newUser.email
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

// 3. Remove admin privileges from a user
exports.removeAdminUser = async (req, res, next) => {
  try {
    const email = decodeURIComponent(req.params.email);
    
    // Prevent removing yourself
    const requestingAdmin = req.user;
    if (requestingAdmin.email === email) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You cannot remove your own admin privileges' 
      });
    }
    
    // Check if email exists as an admin
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email,
        role: 'ADMIN'
      }
    });
    
    if (!existingAdmin) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Admin not found with this email' 
      });
    }
    
    // Begin a transaction to ensure both operations complete or fail together
    const [updatedUser, deletedProfile] = await prisma.$transaction([
      // Demote the user to a regular user
      prisma.user.update({
        where: { email },
        data: { role: 'PATIENT' } // or another appropriate role
      }),
      
      // Remove the admin profile
      prisma.adminProfile.deleteMany({
        where: { email }      })
    ]);
    
    // Return 204 No Content as specified in frontend requirements
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};
