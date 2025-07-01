// src/users/adminController.js
const { prisma } = require('../config');

// Get admin emails only
exports.getAdminEmails = async (req, res, next) => {
  try {
    const admins = await prisma.adminProfile.findMany({
      select: {
        id: true,
        email: true
      }
    });
    res.json(admins);
  } catch (err) { next(err); }
};

// 1. Create a new admin profile
exports.createAdmin = async (req, res, next) => {
  try {
    const { email, fullName, specialty, phone } = req.body;
    
    // Check if user already exists
    const existingAdmin = await prisma.adminProfile.findUnique({
      where: { email }
    });
    
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }
    
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
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: { 
        email, 
        role: 'ADMIN' 
      }
    });
    
    res.status(201).json(admin);
  } catch (err) { next(err); }
};

// 2. Read all admin profiles
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await prisma.adminProfile.findMany();
    res.json(admins);
  } catch (err) { next(err); }
};

// 3. Read one admin by ID
exports.getAdminById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const admin = await prisma.adminProfile.findUnique({ where: { id } });
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (err) { next(err); }
};

// 4. Update admin by ID
exports.updateAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { fullName, specialty, phone } = req.body;
    
    // Check if admin exists
    const admin = await prisma.adminProfile.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Update admin profile
    const updatedAdmin = await prisma.adminProfile.update({
      where: { id },
      data: { 
        fullName, 
        specialty, 
        phone 
      }
    });
    
    res.json(updatedAdmin);
  } catch (err) { next(err); }
};

// 5. Delete admin by ID
exports.deleteAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Check if admin exists
    const admin = await prisma.adminProfile.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Delete admin profile
    await prisma.adminProfile.delete({ where: { id } });
    
    // Optionally, we could also delete the associated user record
    // or change its role, but that's a business decision
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) { next(err); }
};