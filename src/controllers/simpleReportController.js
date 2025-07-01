// src/controllers/simpleReportController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get all reports from the database
 * Simplified version with minimal processing
 */
exports.getAllReports = async (req, res, next) => {
  try {
    // Get all reports directly from the database
    const reports = await prisma.report.findMany({
      orderBy: {
        uploadedAt: 'desc'
      },
      include: {
        Feedback: true // Include associated feedback
      }
    });
    
    // Add download URLs and filenames
    const enhancedReports = reports.map(report => {
      // Extract filename from path
      const filename = report.filePath ? path.basename(report.filePath) : 'unknown';
      
      return {
        ...report,
        filename,
        fullFileUrl: `${req.protocol}://${req.get('host')}${report.fileUrl}`
      };
    });
    
    logger.info(`Retrieved all ${reports.length} reports via simplified API`);
    
    res.json({
      success: true,
      totalReports: reports.length,
      reports: enhancedReports
    });
  } catch (err) { 
    logger.error(`Error retrieving all reports: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

/**
 * Delete a report and its associated file
 */
exports.deleteReportFile = async (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    
    // Find the report to get the file path
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { Feedback: true }
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: 'The report you are trying to delete does not exist'
      });
    }
    
    // Delete related feedback first
    if (report.Feedback && report.Feedback.length > 0) {
      await prisma.feedback.deleteMany({
        where: { reportId }
      });
    }
    
    // Delete the report from the database
    await prisma.report.delete({
      where: { id: reportId }
    });
    
    // Delete the file if it exists
    if (report.filePath) {
      try {
        await fs.unlink(report.filePath);
        logger.info(`File deleted successfully: ${report.filePath}`);
      } catch (fileError) {
        logger.warn(`Failed to delete file ${report.filePath}: ${fileError.message}`);
        // Continue with the response even if file deletion fails
      }
    }
    
    logger.info(`Report ${reportId} and its file were deleted`);
    
    res.json({
      success: true,
      message: 'Report and associated file deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting report: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};
