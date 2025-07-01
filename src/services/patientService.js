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
      if (!fullName || !age) {
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

/**
 * Get all feedback for a specific report or patient
 * This function allows frontend to fetch feedback for a specific report
 * or all feedback for a specific patient
 * @param {number} id - The report ID or patient ID
 * @param {Object} options - Options for filtering and formatting results
 * @param {number} options.limit - Number of results per page (default: 10)
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.sort - Sort direction: 'asc' or 'desc' (default: 'desc')
 * @param {string} options.format - Response format: 'detailed' or 'simple' (default: 'detailed')
 */
async function getFeedbacks(id, options = {}) {
  try {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      logger.error(`Invalid ID format: ${id}`);
      throw new Error('Invalid ID format');
    }
    
    // Set default options
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    const sortDirection = options.sort === 'asc' ? 'asc' : 'desc';
    const format = options.format || 'detailed';
    
    // First try to find a report with this ID
    const report = await prisma.report.findUnique({
      where: { id: numericId }
    });
      // If ID matches a report, get feedback for that specific report
    if (report) {
      logger.info(`Fetching feedback for report ID: ${numericId}`);
      
      // Get total count for pagination
      const totalCount = await prisma.feedback.count({
        where: { reportId: numericId }
      });
      
      // Get feedback for the report with pagination
      const feedback = await prisma.feedback.findMany({
        where: { reportId: numericId },
        orderBy: { createdAt: sortDirection },
        skip: skip,
        take: limit
      });
        // Format the feedback based on requested format
      let formattedFeedback;
      if (format === 'simple') {
        formattedFeedback = feedback.map(item => ({
          id: item.id,
          message: item.message,
          createdAt: item.createdAt
        }));
      } else {
        formattedFeedback = feedback.map(item => ({
          id: item.id,
          message: item.message,
          createdAt: item.createdAt,
          adminId: item.adminId
          // No admin name included, as requested
        }));
      }
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      logger.info(`Retrieved ${feedback.length} feedback entries for report ${numericId}`);
      
      return {
        success: true,
        reportId: report.id,
        reportTitle: report.title,
        uploadedAt: report.uploadedAt,
        pagination: {
          page: page,
          limit: limit,
          totalItems: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        },
        feedback: formattedFeedback
      };
    } 
    // If ID is not a report ID, check if it's a patient ID
    else {
      logger.info(`No report found with ID ${numericId}, trying as patient ID`);
      
      // Check if this is a valid patient ID
      const patient = await prisma.patientProfile.findUnique({
        where: { id: numericId }
      });
      
      if (!patient) {
        logger.error(`Neither report nor patient found with ID: ${id}`);
        throw new Error('Invalid ID - not a valid report or patient ID');
      }      
      // Get all reports for this patient
      const patientReports = await prisma.report.findMany({
        where: { patientId: numericId }
      });
      
      if (patientReports.length === 0) {
        logger.info(`No reports found for patient ${numericId}`);
        return {
          success: true,
          patientId: numericId,
          patientName: patient.fullName,
          pagination: {
            page: 1,
            limit: limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          feedback: []
        };
      }
      
      // Get all report IDs
      const reportIds = patientReports.map(report => report.id);
      
      // Get total count for pagination
      const totalCount = await prisma.feedback.count({
        where: { 
          reportId: { in: reportIds } 
        }
      });
      
      // Get all feedback for these reports with pagination
      const allFeedback = await prisma.feedback.findMany({
        where: { 
          reportId: { in: reportIds } 
        },
        orderBy: { createdAt: sortDirection },
        skip: skip,
        take: limit,
        include: {
          Report: {
            select: {
              id: true,
              title: true,
              uploadedAt: true
            }
          }
        }
      });
        // Format the feedback based on requested format
      let formattedFeedback;
      if (format === 'simple') {
        formattedFeedback = allFeedback.map(item => ({
          id: item.id,
          message: item.message,
          createdAt: item.createdAt,
          reportId: item.reportId,
          reportTitle: item.Report.title
        }));      } else {
        formattedFeedback = allFeedback.map(item => ({
          id: item.id,
          message: item.message,
          createdAt: item.createdAt,
          reportId: item.reportId,
          reportTitle: item.Report.title,
          reportDate: item.Report.uploadedAt,
          adminId: item.adminId
          // No admin name included, as requested
        }));
      }
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      logger.info(`Retrieved ${formattedFeedback.length} feedback entries for patient ${numericId}`);
      
      return {
        success: true,
        patientId: numericId,
        patientName: patient.fullName,
        pagination: {
          page: page,
          limit: limit,
          totalItems: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        },
        feedback: formattedFeedback
      };
    }
  } catch (error) {
    logger.error(`Error fetching feedback for ID: ${id}`, {
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
  isEmailInUse,
  getFeedbacks
};