// src/services/patientService.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Get patient profile by ID
 */
async function getPatientById(id) {
  try {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      logger.error(`Invalid patient ID format: ${id}`);
      throw new Error('Invalid patient ID format');
    }
    
    return await prisma.patientProfile.findUnique({
      where: { id: numericId }
    });
  } catch (error) {
    logger.error(`Error fetching patient by ID: ${id}`, {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get patient profile by email
 */
async function getPatientByEmail(email) {
  try {
    if (!email || typeof email !== 'string') {
      logger.error(`Invalid email format: ${email}`);
      throw new Error('Invalid email format');
    }
    
    return await prisma.patientProfile.findFirst({
      where: { email }
    });
  } catch (error) {
    logger.error(`Error fetching patient by email: ${email}`, {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Update patient profile basic information
 */
async function updatePatientBasicInfo(id, { fullName, age, nicNumber, mobileNumber }) {
  try {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      logger.error(`Invalid patient ID format for update: ${id}`);
      throw new Error('Invalid patient ID format');
    }
    
    if (!fullName || !age || !nicNumber) {
      logger.error(`Missing required fields for patient update`, {
        id: numericId,
        providedFields: { fullName, age, nicNumber, mobileNumber }
      });
      throw new Error('Missing required fields for patient update');
    }
    
    return await prisma.patientProfile.update({
      where: { id: numericId },
      data: { 
        fullName, 
        age, 
        nicNumber,
        mobileNumber,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error updating patient basic info for ID: ${id}`, {
      data: { fullName, age, nicNumber, mobileNumber },
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Update patient email
 */
async function updatePatientEmail(id, email) {
  try {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      logger.error(`Invalid patient ID format for email update: ${id}`);
      throw new Error('Invalid patient ID format');
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      logger.error(`Invalid email format for update: ${email}`);
      throw new Error('Invalid email format');
    }
    
    return await prisma.patientProfile.update({
      where: { id: numericId },
      data: { 
        email,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error updating email for patient ID: ${id}`, {
      newEmail: email,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Check if email is already in use by another patient
 */
async function isEmailInUse(email, excludePatientId = null) {
  try {
    if (!email || typeof email !== 'string') {
      logger.error(`Invalid email format for checking usage: ${email}`);
      throw new Error('Invalid email format');
    }
    
    const query = { email };
    
    if (excludePatientId) {
      const numericId = Number(excludePatientId);
      if (!isNaN(numericId)) {
        query.id = { not: numericId };
      } else {
        logger.warn(`Invalid excludePatientId format: ${excludePatientId}, ignoring this condition`);
      }
    }
    
    const existingPatient = await prisma.patientProfile.findFirst({
      where: query
    });
    
    return !!existingPatient;
  } catch (error) {
    logger.error(`Error checking if email is in use: ${email}`, {
      excludePatientId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  getPatientById,
  getPatientByEmail,
  updatePatientBasicInfo,
  updatePatientEmail,
  isEmailInUse
};