// src/controllers/adminReportController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Get reports without feedback (admin only)
 * This endpoint allows admins to view reports that don't have feedback yet
 */
exports.getReportsWithoutFeedback = async (req, res, next) => {
  try {
    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to access admin reports endpoint by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can access this endpoint'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Apply filters
    const where = {};

    // Filter by patient ID if provided
    if (req.query.patientId) {
      where.patientId = Number(req.query.patientId);
    }

    // Filter by title search
    if (req.query.search) {
      where.title = {
        contains: req.query.search,
        mode: 'insensitive'
      };
    }

    // Filter by date range
    if (req.query.startDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        gte: new Date(req.query.startDate)
      };
    }

    if (req.query.endDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        lte: new Date(req.query.endDate)
      };
    }
      // Get reports that have no feedback or empty feedback array
    const reportsWithoutFeedback = await prisma.report.findMany({
      where,
      include: {
        Feedback: true
      },
      orderBy: {
        uploadedAt: req.query.order === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: limit
    });

    // Filter out reports that have feedback
    const reports = reportsWithoutFeedback.filter(report =>
      !report.Feedback || report.Feedback.length === 0
    );

    // Fetch patient information separately for the reports
    const patientIds = [...new Set(reports.map(report => report.patientId))];
    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: patientIds }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        age: true
      }
    });

    // Create a map for quick patient lookups
    const patientMap = {};
    patients.forEach(patient => {
      patientMap[patient.id] = patient;
    });

    // Count total reports without feedback for pagination
    const totalReportsQuery = await prisma.report.findMany({
      where,
      include: {
        Feedback: true
      }
    });

    const totalReports = totalReportsQuery.filter(report =>
      !report.Feedback || report.Feedback.length === 0
    ).length;
      // Enhance reports with file metadata and patient info
    const enhancedReports = reports.map(report => {
      // Extract filename from path
      const filename = report.filePath ? path.basename(report.filePath) : 'unknown';

      // Guess mime type from file extension
      const extension = path.extname(filename).toLowerCase();
      let mimeType = 'application/octet-stream'; // Default

      // Map common extensions to mime types
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
      };

      if (mimeTypes[extension]) {
        mimeType = mimeTypes[extension];
      }

      // Add patient information
      const patient = patientMap[report.patientId] || {
        id: report.patientId,
        fullName: 'Unknown Patient',
        email: 'unknown',
        age: null
      };

      return {
        ...report,
        patient,
        filename,
        mimeType,
        // Include a full URL for easy frontend access
        fullFileUrl: `${req.protocol}://${req.get('host')}${report.fileUrl}`
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalReports / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Admin retrieved ${reports.length} reports without feedback (page ${page}/${totalPages})`);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalReports,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      reports: enhancedReports
    });
  } catch (err) {
    logger.error(`Error retrieving reports without feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Add feedback to a report (admin only)
 */
exports.addFeedbackToReport = async (req, res, next) => {
  try {    const reportId = Number(req.params.id);
    const { message } = req.body;

    // Verify admin role and get admin ID
    const isAdmin = req.user?.role === 'ADMIN';
    const adminId = req.user?.userId; // Changed from 'adminId' to 'userId' to match JWT payload

    if (!isAdmin || !adminId) {
      logger.warn(`Unauthorized attempt to add feedback by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can add feedback to reports'
      });
    }

    // Validate feedback message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing feedback message',
        message: 'Feedback message is required'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Feedback too long',
        message: 'Feedback message must be less than 2000 characters'
      });
    }

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { Feedback: true }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: 'The report you are trying to add feedback to does not exist'
      });
    }

    // Add feedback
    const feedback = await prisma.feedback.create({
      data: {
        reportId,
        adminId,
        message,
        createdAt: new Date()
      }
    });

    logger.info(`Admin ${adminId} added feedback to report ${reportId}`);

    res.status(201).json({
      success: true,
      message: 'Feedback added successfully',
      feedback
    });
  } catch (err) {
    logger.error(`Error adding feedback to report: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Get all feedback provided to reports (admin only)
 * This endpoint allows admins to view all feedback provided to reports
 */
exports.getReportFeedback = async (req, res, next) => {
  try {
    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to access admin feedback endpoint by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can access this endpoint'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Apply filters
    const where = {};

    // Filter by admin ID if provided
    if (req.query.adminId) {
      where.adminId = Number(req.query.adminId);
    }

    // Filter by report ID if provided
    if (req.query.reportId) {
      where.reportId = Number(req.query.reportId);
    }

    // Filter by date range
    if (req.query.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(req.query.startDate)
      };
    }

    if (req.query.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(req.query.endDate)
      };
    }

    // Get feedback with associated report information
    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        Report: {
          select: {
            id: true,
            title: true,
            patientId: true,
            uploadedAt: true,
            fileUrl: true,
            filePath: true
          }
        }
      },
      orderBy: {
        createdAt: req.query.order === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: limit
    });

    // Count total feedback for pagination
    const totalFeedback = await prisma.feedback.count({ where });

    // Fetch patient information for each report
    const patientIds = [...new Set(feedback.map(item => item.Report.patientId))];
    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: patientIds }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        age: true
      }
    });

    // Create a map for quick patient lookups
    const patientMap = {};
    patients.forEach(patient => {
      patientMap[patient.id] = patient;
    });

    // Enhance feedback with patient info and file metadata
    const enhancedFeedback = feedback.map(item => {
      // Extract filename from path
      const filename = item.Report.filePath ? path.basename(item.Report.filePath) : 'unknown';

      // Add patient information
      const patient = patientMap[item.Report.patientId] || {
        id: item.Report.patientId,
        fullName: 'Unknown Patient',
        email: 'unknown',
        age: null
      };

      return {
        ...item,
        Report: {
          ...item.Report,
          patient,
          filename,
          fullFileUrl: `${req.protocol}://${req.get('host')}${item.Report.fileUrl}`
        }
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalFeedback / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Admin retrieved ${feedback.length} feedback records (page ${page}/${totalPages})`);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalFeedback,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      feedback: enhancedFeedback
    });
  } catch (err) {
    logger.error(`Error retrieving feedback: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Get all reports with patient details (admin only)
 * This endpoint allows admins to view all patient reports with complete patient information
 */
exports.getAllReportsWithPatientDetails = async (req, res, next) => {
  try {
    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to access admin reports endpoint by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can access this endpoint'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Apply filters
    const where = {};

    // Filter by patient ID if provided
    if (req.query.patientId) {
      where.patientId = Number(req.query.patientId);
    }

    // Filter by title search
    if (req.query.search) {
      where.title = {
        contains: req.query.search,
        mode: 'insensitive'
      };
    }

    // Filter by date range
    if (req.query.startDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        gte: new Date(req.query.startDate)
      };
    }

    if (req.query.endDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        lte: new Date(req.query.endDate)
      };
    }

    // Get all reports with feedback information
    const reports = await prisma.report.findMany({
      where,
      include: {
        Feedback: true
      },
      orderBy: {
        uploadedAt: req.query.order === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: limit
    });

    // Count total reports for pagination
    const totalReports = await prisma.report.count({ where });

    // Fetch patient information separately for the reports
    const patientIds = [...new Set(reports.map(report => report.patientId))];
    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: patientIds }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        age: true
      }
    });

    // Create a map for quick patient lookups
    const patientMap = {};
    patients.forEach(patient => {
      patientMap[patient.id] = patient;
    });

    // Enhance reports with file metadata and patient info
    const enhancedReports = reports.map(report => {
      // Extract filename from path
      const filename = report.filePath ? path.basename(report.filePath) : 'unknown';

      // Guess mime type from file extension
      const extension = path.extname(filename).toLowerCase();
      let mimeType = 'application/octet-stream'; // Default

      // Map common extensions to mime types
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
      };

      if (mimeTypes[extension]) {
        mimeType = mimeTypes[extension];
      }

      // Add patient information
      const patient = patientMap[report.patientId] || {
        id: report.patientId,
        fullName: 'Unknown Patient',
        email: 'unknown',
        age: null
      };

      return {
        ...report,
        patient,
        filename,
        mimeType,
        // Include a full URL for easy frontend access
        fullFileUrl: `${req.protocol}://${req.get('host')}${report.fileUrl}`
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalReports / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Admin retrieved ${reports.length} reports with patient details (page ${page}/${totalPages})`);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalReports,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      reports: enhancedReports
    });
  } catch (err) {
    logger.error(`Error retrieving reports with patient details: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Delete a report (admin only)
 * This endpoint allows admins to delete a report
 */
exports.deleteReport = async (req, res, next) => {
  try {
    const reportId = Number(req.params.id);

    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to delete report by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can delete reports'
      });
    }

    // Check if report exists
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

    // Delete the report
    await prisma.report.delete({
      where: { id: reportId }
    });

    // File cleanup - delete the actual file from the filesystem
    const { deleteFile } = require('../utils/fileUploadUtil');
    if (report.filePath) {
      try {
        await deleteFile(report.filePath);
        logger.info(`File deleted successfully: ${report.filePath}`);
      } catch (fileError) {
        logger.warn(`Failed to delete file ${report.filePath}: ${fileError.message}`);
        // Continue with the response even if file deletion fails
      }
    }

    logger.info(`Admin deleted report ${reportId}`);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting report: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Get total count of reports in the database (admin only)
 * This endpoint provides a simple count of all reports with optional filtering
 */
exports.getReportCount = async (req, res, next) => {
  try {
    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to access report count by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can access this endpoint'
      });
    }

    // Apply filters
    const where = {};

    // Filter by patient ID if provided
    if (req.query.patientId) {
      where.patientId = Number(req.query.patientId);
    }

    // Filter by title search
    if (req.query.search) {
      where.title = {
        contains: req.query.search,
        mode: 'insensitive'
      };
    }

    // Filter by date range
    if (req.query.startDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        gte: new Date(req.query.startDate)
      };
    }

    if (req.query.endDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        lte: new Date(req.query.endDate)
      };
    }

    // Count total reports
    const totalReports = await prisma.report.count({ where });

    // Count reports with feedback
    const reportsWithFeedback = await prisma.report.count({
      where: {
        ...where,
        Feedback: {
          some: {}
        }
      }
    });

    // Count reports without feedback
    const reportsWithoutFeedback = totalReports - reportsWithFeedback;

    // Get count by month for the current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st of current year

    // Get all reports for the current year
    const reportsThisYear = await prisma.report.findMany({
      where: {
        ...where,
        uploadedAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        id: true,
        uploadedAt: true
      }
    });

    // Group by month
    const reportsByMonth = Array(12).fill(0);
    reportsThisYear.forEach(report => {
      const month = report.uploadedAt.getMonth(); // 0-11
      reportsByMonth[month]++;
    });

    // Format month data for response
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyData = reportsByMonth.map((count, index) => ({
      month: monthNames[index],
      count
    }));

    logger.info(`Admin retrieved report count statistics: ${totalReports} total reports`);

    res.json({
      success: true,
      counts: {
        total: totalReports,
        withFeedback: reportsWithFeedback,
        withoutFeedback: reportsWithoutFeedback,
        feedbackPercentage: totalReports > 0 ? Math.round((reportsWithFeedback / totalReports) * 100) : 0
      },
      byMonth: {
        year: currentYear,
        data: monthlyData
      },
      filters: Object.keys(where).length > 0 ? where : null
    });
  } catch (err) {
    logger.error(`Error retrieving report count: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Search reports by patient email (admin only)
 * This endpoint allows admins to search for reports by patient email
 */
exports.searchReportsByPatientEmail = async (req, res, next) => {
  try {
    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to search reports by patient email by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can access this endpoint'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get patient email from query parameter
    const patientEmail = req.query.email;

    // Apply filters
    const where = {};

    // Filter by patient ID if provided
    if (req.query.patientId) {
      where.patientId = Number(req.query.patientId);
    }

    // Filter by title search
    if (req.query.search) {
      where.title = {
        contains: req.query.search,
        mode: 'insensitive'
      };
    }

    // Filter by date range
    if (req.query.startDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        gte: new Date(req.query.startDate)
      };
    }

    if (req.query.endDate) {
      where.uploadedAt = {
        ...where.uploadedAt,
        lte: new Date(req.query.endDate)
      };
    }

    // First, find patients matching the email (if provided)
    let patientIds = [];
    if (patientEmail) {
      const matchingPatients = await prisma.patientProfile.findMany({
        where: {
          email: {
            contains: patientEmail,
            mode: 'insensitive'
          }
        },
        select: {
          id: true
        }
      });

      patientIds = matchingPatients.map(patient => patient.id);

      // If email was provided but no patients found, return empty results
      if (patientEmail && patientIds.length === 0) {
        return res.json({
          success: true,
          message: 'No patients found with the provided email',
          pagination: {
            page,
            limit,
            totalReports: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          reports: []
        });
      }

      // Add patient IDs to the where clause
      if (patientIds.length > 0) {
        where.patientId = {
          in: patientIds
        };
      }
    }

    // Get all reports with feedback information
    const reports = await prisma.report.findMany({
      where,
      include: {
        Feedback: true
      },
      orderBy: {
        uploadedAt: req.query.order === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: limit
    });

    // Count total reports for pagination
    const totalReports = await prisma.report.count({ where });

    // Fetch patient information separately for the reports
    const reportPatientIds = [...new Set(reports.map(report => report.patientId))];
    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: reportPatientIds }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        age: true,
        nicNumber: true,
        mobileNumber: true
      }
    });

    // Create a map for quick patient lookups
    const patientMap = {};
    patients.forEach(patient => {
      patientMap[patient.id] = patient;
    });

    // Enhance reports with file metadata and patient info
    const enhancedReports = reports.map(report => {
      // Extract filename from path
      const filename = report.filePath ? path.basename(report.filePath) : 'unknown';

      // Guess mime type from file extension
      const extension = path.extname(filename).toLowerCase();
      let mimeType = 'application/octet-stream'; // Default

      // Map common extensions to mime types
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
      };

      if (mimeTypes[extension]) {
        mimeType = mimeTypes[extension];
      }

      // Add patient information
      const patient = patientMap[report.patientId] || {
        id: report.patientId,
        fullName: 'Unknown Patient',
        email: 'unknown',
        age: null
      };

      return {
        ...report,
        patient,
        filename,
        mimeType,
        // Include a full URL for easy frontend access
        fullFileUrl: `${req.protocol}://${req.get('host')}${report.fileUrl}`
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalReports / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Admin searched reports by patient email: ${patientEmail || 'all'} (found ${reports.length} reports, page ${page}/${totalPages})`);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalReports,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      reports: enhancedReports,
      filters: {
        patientEmail: patientEmail || null,
        ...where
      }
    });
  } catch (err) {
    logger.error(`Error searching reports by patient email: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};