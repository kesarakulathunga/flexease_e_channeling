// src/controllers/profileController.js
const { prisma } = require('../config');
const patientService = require('../services/patientService');
const { sendOtp, verifyOtp } = require('../auth/otpService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { createSession } = require('../services/sessionService');
const logger = require('../utils/logger');

/**
 * Get patient profile - ensures user can only access their own profile
 */
exports.getPatientProfile = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`Get profile request for patient ID: ${id}`, { 
      userId: req.user.id, 
      userRole: req.user.role 
    });
    
    // Authorization check - ensure user can only access their own profile
    if (req.user.patientId !== id && req.user.role !== 'ADMIN') {
      logger.warn(`Unauthorized profile access attempt`, {
        userId: req.user.id,
        userRole: req.user.role,
        attemptedPatientId: id
      });
      return res.status(403).json({ error: 'Unauthorized access to profile' });
    }
    
    const patient = await patientService.getPatientById(id);
    
    if (!patient) {
      logger.warn(`Patient profile not found`, { patientId: id });
      return res.status(404).json({ error: 'Patient profile not found' });
    }
    
    logger.info(`Successfully retrieved profile for patient ID: ${id}`);
    res.json(patient);
  } catch (err) {
    logger.error(`Error retrieving patient profile`, {
      patientId: req.params.id,
      error: err.message,
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Update patient basic information (name, age, nicNumber, mobileNumber)
 */
exports.updatePatientBasicInfo = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`Profile update request for patient ID: ${id}`, {
      userId: req.user.id,
      userRole: req.user.role
    });
    
    // Authorization check
    if (req.user.patientId !== id && req.user.role !== 'ADMIN') {
      logger.warn(`Unauthorized profile update attempt`, {
        userId: req.user.id,
        userRole: req.user.role,
        attemptedPatientId: id
      });
      return res.status(403).json({ error: 'Unauthorized to update profile' });
    }
    
    const { fullName, age, nicNumber, mobileNumber } = req.body;
    
    // Validate inputs
    if (!fullName || !age || !nicNumber) {
      logger.warn(`Invalid profile update data - missing required fields`, {
        patientId: id,
        providedFields: Object.keys(req.body)
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (typeof age !== 'number' || age < 1 || age > 120) {
      logger.warn(`Invalid age value in profile update`, {
        patientId: id,
        providedAge: age
      });
      return res.status(400).json({ error: 'Invalid age value' });
    }
    
    // Update the profile
    const updatedPatient = await patientService.updatePatientBasicInfo(id, {
      fullName,
      age,
      nicNumber,
      mobileNumber
    });
    
    logger.info(`Successfully updated profile for patient ID: ${id}`, {
      fieldsUpdated: ['fullName', 'age', 'nicNumber', 'mobileNumber'].filter(f => req.body[f] !== undefined)
    });
    
    res.json(updatedPatient);
  } catch (err) {
    logger.error(`Error updating patient profile`, {
      patientId: req.params.id,
      requestBody: req.body,
      error: err.message,
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Initiate email change process
 */
exports.initiateEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const patientId = Number(req.user.patientId);
    
    logger.info(`Email change initiation request for patient ID: ${patientId}`, {
      userId: req.user.id,
      currentEmail: req.user.email,
      newEmail
    });
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      logger.warn(`Invalid email format provided for email change`, {
        patientId,
        newEmail
      });
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if email is already in use
    const isInUse = await patientService.isEmailInUse(newEmail, patientId);
    if (isInUse) {
      logger.warn(`Email change request with already used email`, {
        patientId,
        newEmail
      });
      return res.status(400).json({ error: 'Email is already in use by another account' });
    }
    
    // Send OTP to the new email
    await sendOtp(newEmail, 'LOGIN', patientId, 'email_change');
    logger.info(`OTP sent successfully for email change`, {
      patientId,
      newEmail
    });
    
    res.json({ 
      success: true, 
      message: 'Verification code sent to new email address'
    });
  } catch (err) {
    logger.error(`Error initiating email change`, {
      patientId: req.user.patientId,
      newEmail: req.body.newEmail,
      error: err.message,
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Verify and complete email change
 */
exports.verifyEmailChange = async (req, res, next) => {
  try {
    const { newEmail, code } = req.body;
    const patientId = Number(req.user.patientId);
    
    logger.info(`Email change verification request for patient ID: ${patientId}`, {
      userId: req.user.id,
      currentEmail: req.user.email,
      newEmail
    });
    
    // Validate OTP format
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      logger.warn(`Invalid OTP format for email change verification`, {
        patientId,
        newEmail,
        codeLength: code ? code.length : 0
      });
      return res.status(400).json({ error: 'Invalid verification code format' });
    }
    
    // Verify the OTP
    try {
      await verifyOtp(newEmail, code, 'LOGIN', patientId, 'email_change');
      logger.info(`OTP verification successful for email change`, {
        patientId,
        newEmail
      });
    } catch (error) {
      logger.warn(`OTP verification failed for email change`, {
        patientId,
        newEmail,
        error: error.message
      });
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Update the email
    const updatedPatient = await patientService.updatePatientEmail(patientId, newEmail);
    logger.info(`Patient email updated successfully`, {
      patientId,
      oldEmail: req.user.email,
      newEmail
    });
    
    // Update the user record as well
    try {
      await prisma.user.update({
        where: { email: req.user.email },
        data: { email: newEmail }
      });
      logger.info(`User record email updated successfully`, {
        userId: req.user.id,
        oldEmail: req.user.email,
        newEmail
      });
    } catch (userUpdateError) {
      logger.error(`Failed to update user record email`, {
        userId: req.user.id,
        patientId,
        oldEmail: req.user.email,
        newEmail,
        error: userUpdateError.message,
        stack: userUpdateError.stack
      });
      // Continue anyway - we'll log the error but not fail the request
    }
    
    // Generate new token with updated email
    const payload = { 
      email: newEmail, 
      role: req.user.role,
      patientId
    };
    
    // Sign token & persist session
    try {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
      const user = await prisma.user.findUnique({ where: { email: newEmail } });
      
      if (!user) {
        logger.error(`User record not found after email update`, {
          newEmail,
          patientId
        });
        // Continue without creating session
      } else {
        await createSession({ userId: user.id, token, expiresAt });
        logger.info(`New session created after email change`, {
          userId: user.id,
          patientId,
          newEmail
        });
        
        res.json({
          success: true,
          message: 'Email updated successfully',
          profile: updatedPatient,
          token
        });
      }
    } catch (tokenError) {
      logger.error(`Error creating new token/session after email change`, {
        patientId,
        newEmail,
        error: tokenError.message,
        stack: tokenError.stack
      });
      
      // Return success but without token
      res.json({
        success: true,
        message: 'Email updated but session refresh failed. Please log in again.',
        profile: updatedPatient
      });
    }
  } catch (err) {
    logger.error(`Error completing email change process`, {
      patientId: req.user.patientId,
      newEmail: req.body.newEmail,
      error: err.message,
      stack: err.stack
    });
    next(err);
  }
};
