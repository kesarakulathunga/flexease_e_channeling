// src/controllers/patientFeedbackController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Get feedback for a specific patient report
 * This endpoint allows patients to view feedback for their own reports
 */
exports.getReportFeedback = async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);
    const patientId = req.user?.patientId;
    
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10 feedback items
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const skip = (page - 1) * limit;
    const sortDirection = req.query.sort === 'asc' ? 'asc' : 'desc'; // Default sort by newest
    const format = req.query.format || 'detailed'; // 'detailed' or 'simple'
    
    logger.info(`Retrieving feedback for Report ID: ${reportId}, Patient ID: ${patientId}, Limit: ${limit}, Page: ${page}, Sort: ${sortDirection}, Format: ${format}`);
    
    // Ensure the user is a patient
    if (!patientId) {
      logger.warn(`Unauthorized attempt to access patient feedback by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only patients can access this endpoint'
      });
    }
    
    // Find the report first (without including feedback)
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });
    
    // If report doesn't exist
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: 'The report you are trying to view does not exist'
      });
    }
      // Security check: Ensure the patient can only access their own reports
    if (report.patientId !== patientId) {
      logger.warn(`Patient ${patientId} attempted to access feedback for report ${reportId} belonging to patient ${report.patientId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view feedback for this report'
      });
    }
      // Now that we've verified ownership, fetch the feedback separately
    // Get total feedback count for pagination
    const totalFeedback = await prisma.feedback.count({
      where: { reportId: reportId }
    });
    
    // Fetch feedback with pagination and sorting
    const feedback = await prisma.feedback.findMany({
      where: { reportId: reportId },
      orderBy: { createdAt: sortDirection },
      skip: skip,
      take: limit
    });
    
    logger.info(`Found ${feedback.length} feedback entries for report ${reportId} (page ${page} of ${Math.ceil(totalFeedback/limit)})`);
      // Format the feedback based on the requested format
    let feedbackResponse;
    
    if (format === 'simple') {
      // Simple format with minimal details
      feedbackResponse = feedback.map(item => ({
        id: item.id,
        message: item.message,
        createdAt: item.createdAt
      }));
    } else {
      // Detailed format without the admin name
      feedbackResponse = feedback.map(item => ({
        id: item.id,
        message: item.message,
        createdAt: item.createdAt,
        adminId: item.adminId
        // No admin name included, as requested
      }));
    }
    
    logger.info(`Patient ${patientId} viewed feedback for report ${reportId}`);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalFeedback / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
      res.json({
      success: true,
      reportId: report.id,
      reportTitle: report.title,
      uploadedAt: report.uploadedAt,
      pagination: {
        page: page,
        limit: limit,
        totalItems: totalFeedback,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage
      },
      feedback: feedbackResponse
    });
      } catch (err) {
    logger.error(`Error retrieving patient report feedback: ${err.message}`, {
      stack: err.stack
    });
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while retrieving feedback'
    });
  }
};
