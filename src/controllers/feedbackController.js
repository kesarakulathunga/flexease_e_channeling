// src/controllers/feedbackController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

// 1. Add feedback to a report
exports.addFeedback = async (req, res, next) => {
  try {
    const { reportId, message } = req.body;
    
    // Get admin ID from authenticated user - only admins can provide feedback
    const adminId = req.user?.adminId;
    
    // Validate admin authentication
    if (!adminId) {
      logger.warn('Attempt to add feedback without admin authentication');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in as an admin to provide feedback'
      });
    }
    
    // Validate required fields
    if (!reportId || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        message: 'Report ID and message are required'
      });
    }
    
    // Check if the report exists
    const report = await prisma.report.findUnique({
      where: { id: Number(reportId) }
    });
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        error: 'Report not found',
        message: 'The report you are trying to provide feedback for does not exist'
      });
    }
    
    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        reportId: Number(reportId),
        adminId,
        message,
        createdAt: new Date()
      }
    });
    
    logger.info(`Feedback added to report ${reportId} by admin ${adminId}`);
    
    res.status(201).json({
      success: true,
      message: 'Feedback added successfully',
      feedback
    });
  } catch (err) { 
    logger.error(`Error adding feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 2. Get feedback for a specific report
exports.getFeedbackByReport = async (req, res, next) => {
  try {
    const reportId = Number(req.query.reportId);
    
    if (!reportId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameter',
        message: 'Report ID is required'
      });
    }
    
    // Determine user type and apply appropriate security
    const isAdmin = req.user?.role === 'ADMIN';
    const patientId = req.user?.patientId;
    
    // For patients, ensure they can only access feedback for their own reports
    if (!isAdmin && patientId) {
      // Check if the report belongs to the patient
      const report = await prisma.report.findUnique({
        where: { id: reportId }
      });
      
      if (!report) {
        return res.status(404).json({ 
          success: false,
          error: 'Report not found',
          message: 'The specified report does not exist'
        });
      }
      
      if (report.patientId !== patientId) {
        logger.warn(`Security alert: Patient ${patientId} attempted to access feedback for report ${reportId} belonging to patient ${report.patientId}`);
        
        return res.status(403).json({ 
          success: false,
          error: 'Access denied',
          message: 'You can only access feedback for your own reports'
        });
      }
    }
    
    // Get feedback for the report
    const feedback = await prisma.feedback.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
      include: {
        Report: false // Don't need to include report details here
      }
    });
    
    res.json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (err) { 
    logger.error(`Error retrieving feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 3. Get all feedback by a specific admin
exports.getFeedbackByAdmin = async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    const isAdmin = req.user?.role === 'ADMIN';
    
    if (!isAdmin) {
      logger.warn('Non-admin attempt to access admin feedback data');
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'This endpoint is only available to administrators'
      });
    }
    
    // If an admin is viewing their own feedback, use their ID from auth
    // Otherwise if they're looking up another admin's feedback, use the query parameter
    let adminId = req.user?.adminId;
    
    if (req.query.adminId) {
      adminId = Number(req.query.adminId);
    }
    
    if (!adminId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameter',
        message: 'Admin ID is required'
      });
    }
    
    const feedback = await prisma.feedback.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      include: { 
        Report: {
          select: {
            id: true,
            title: true,
            patientId: true,
            uploadedAt: true
          }
        } 
      }
    });
    
    res.json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (err) { 
    logger.error(`Error retrieving admin feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 4. Get a specific feedback by ID
exports.getFeedbackById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Determine user type for security check
    const isAdmin = req.user?.role === 'ADMIN';
    const patientId = req.user?.patientId;
    
    // Check if the feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: { 
        Report: true  // Include report to check ownership
      }
    });
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        error: 'Feedback not found',
        message: 'The requested feedback does not exist'
      });
    }
    
    // Apply security check - patients can only access feedback for their reports
    if (!isAdmin && patientId) {
      const report = feedback.Report;
      
      if (report.patientId !== patientId) {
        logger.warn(`Security alert: Patient ${patientId} attempted to access feedback ${id} for report ${report.id} belonging to patient ${report.patientId}`);
        
        return res.status(403).json({ 
          success: false,
          error: 'Access denied',
          message: 'You can only access feedback for your own reports'
        });
      }
    }
    
    res.json({
      success: true,
      feedback: {
        ...feedback,
        Report: isAdmin ? feedback.Report : undefined  // Only include Report details for admins
      }
    });
  } catch (err) { 
    logger.error(`Error retrieving feedback details: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 5. Update feedback
exports.updateFeedback = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body;
    
    // Only admins can update feedback, and only their own
    const adminId = req.user?.adminId;
    
    if (!adminId) {
      logger.warn('Attempt to update feedback without admin authentication');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in as an admin to update feedback'
      });
    }
    
    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        error: 'Feedback not found',
        message: 'The feedback you are trying to update does not exist'
      });
    }
    
    // Security check: Admins can only update their own feedback
    if (feedback.adminId !== adminId) {
      logger.warn(`Security alert: Admin ${adminId} attempted to update feedback ${id} created by admin ${feedback.adminId}`);
      
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'You can only update your own feedback'
      });
    }
    
    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { message }
    });
    
    logger.info(`Feedback ${id} updated by admin ${adminId}`);
    
    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback: updatedFeedback
    });
  } catch (err) { 
    logger.error(`Error updating feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 6. Delete feedback
exports.deleteFeedback = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Only admins can delete feedback, and only their own
    const adminId = req.user?.adminId;
    
    if (!adminId) {
      logger.warn('Attempt to delete feedback without admin authentication');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in as an admin to delete feedback'
      });
    }
    
    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        error: 'Feedback not found',
        message: 'The feedback you are trying to delete does not exist'
      });
    }
    
    // Security check: Admins can only delete their own feedback
    if (feedback.adminId !== adminId) {
      logger.warn(`Security alert: Admin ${adminId} attempted to delete feedback ${id} created by admin ${feedback.adminId}`);
      
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own feedback'
      });
    }
    
    // Delete feedback
    await prisma.feedback.delete({
      where: { id }
    });
    
    logger.info(`Feedback ${id} deleted by admin ${adminId}`);
    
    res.json({ 
      success: true,
      message: 'Feedback deleted successfully' 
    });
  } catch (err) { 
    logger.error(`Error deleting feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};