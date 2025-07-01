// src/controllers/reportController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const path = require('path');
const { deleteFile } = require('../utils/fileUploadUtil');
const { trackFileUpload } = require('../utils/fileValidationUtil');

// 1. Upload a new report
exports.uploadReport = async (req, res, next) => {
  try {
    const { title, notes } = req.body;
    const file = req.file; // This is populated by multer
    
    // Get patientId from authenticated user
    const patientId = req.user?.patientId;
    
    // Make sure the user is authenticated and is a patient
    if (!patientId) {
      // If a file was uploaded, remove it
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      logger.warn('Attempt to upload report without patient authentication');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in as a patient to upload reports'
      });
    }
    
    // Verify that the patient ID exists in the database
    try {
      const patientExists = await prisma.patientProfile.findFirst({
        where: { id: patientId }
      });
      
      if (!patientExists) {
        // If a file was uploaded but patient doesn't exist, remove the file
        if (file && file.path) {
          await deleteFile(file.path);
        }
        
        logger.warn(`Security alert: Upload attempt with non-existent patientId: ${patientId}`);
        return res.status(403).json({ 
          success: false,
          error: 'Invalid patient ID',
          message: 'You are not authorized to upload reports'
        });
      }
    } catch (dbError) {
      // If a file was uploaded but database check failed, remove the file
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      logger.error(`Database error during patient verification: ${dbError.message}`);
      throw dbError; // Let the error handler catch this
    }
    
    // Validate required fields
    if (!title || !file) {
      // If a file was uploaded but title is missing, remove the file
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        message: 'Title and file are required' 
      });
    }
    
    // Validate title length
    if (title.length < 3 || title.length > 100) {
      // If a file was uploaded but title is invalid, remove the file
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'Invalid title',
        message: 'Title must be between 3 and 100 characters'
      });
    }
    
    // If notes are provided, validate length
    if (notes && notes.length > 1000) {
      // If a file was uploaded but notes are too long, remove the file
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'Notes too long',
        message: 'Notes must be less than 1000 characters'
      });
    }
    
    // Generate URLs for the file
    const fileUrl = `/uploads/reports/${path.basename(file.path)}`;
    const filePath = file.path;
    
    // Create report record
    const report = await prisma.report.create({
      data: {
        patientId,
        title,
        notes: notes || null,
        fileUrl,
        filePath,
        uploadedAt: new Date()
      }
    });
    
    // Track this upload event
    trackFileUpload(file, { 
      reportId: report.id,
      patientId: patientId,
      title: title
    });
      logger.info(`Report uploaded successfully: ID ${report.id} by patient ${patientId}`);
    
    // Extract filename from path for frontend use
    const filename = path.basename(file.path);
    
    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      report: {
        ...report,
        filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        fullFileUrl: `${req.protocol}://${req.get('host')}${report.fileUrl}`
      }
    });
  } catch (err) { 
    // If there was an error and a file was uploaded, clean it up
    if (req.file && req.file.path) {
      await deleteFile(req.file.path);
    }
    
    logger.error(`Error uploading report: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 2. Get all reports (with filtering and pagination)
exports.getReports = async (req, res, next) => {
  try {
    // Determine user type and apply appropriate filtering
    const isAdmin = req.user?.role === 'ADMIN';
    const patientId = req.user?.patientId;
    
    // If patient, they can only see their own reports
    // If admin, they can see all reports or filter by patientId
    const where = {};
    
    // For patients, enforce filtering by their own ID
    if (!isAdmin) {
      if (!patientId) {
        logger.warn('Attempt to access reports without proper authentication');
        return res.status(401).json({ 
          success: false,
          error: 'Authentication error',
          message: 'You must be logged in to access reports' 
        });
      }
      where.patientId = patientId;
    } 
    // For admins with optional filtering by patient
    else if (req.query.patientId) {
      where.patientId = Number(req.query.patientId);
    }
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Apply title search if provided
    if (req.query.search) {
      where.title = {
        contains: req.query.search,
        mode: 'insensitive'
      };
    }
    
    // Parse date range filters if provided
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
    
    // Count total matching reports for pagination info
    const totalReports = await prisma.report.count({ where });
      // Get reports with applied security filter
    const reports = await prisma.report.findMany({
      where,
      orderBy: {
        uploadedAt: req.query.order === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: limit,
      include: {
        Feedback: true // Include associated feedback
      }
    });
    
    // Add file metadata to reports
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
      
      return {
        ...report,
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
    
    logger.info(`Retrieved ${reports.length} reports (page ${page}/${totalPages}) for ${isAdmin ? 'admin' : 'patient ' + patientId}`);
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
    logger.error(`Error retrieving reports: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 3. Get a specific report
exports.getReportById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Determine user type
    const isAdmin = req.user?.role === 'ADMIN';
    const patientId = req.user?.patientId;
    
    // Validate authentication
    if (!isAdmin && !patientId) {
      logger.warn('Unauthorized attempt to access report details');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in to access report details' 
      });
    }
    
    // Fetch the report
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        Feedback: true // Include associated feedback
      }
    });
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        error: 'Report not found',
        message: 'The requested report does not exist or has been removed'
      });
    }
    
    // Security check: Patients can only access their own reports
    if (!isAdmin && report.patientId !== patientId) {
      logger.warn(`Security alert: Patient ${patientId} attempted to access report ${id} belonging to patient ${report.patientId}`);
      
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'You can only access your own reports' 
      });
    }
      logger.info(`Report ${id} retrieved by ${isAdmin ? 'admin' : 'patient ' + patientId}`);
    
    // Enhance the report with additional metadata
    const filename = report.filePath ? path.basename(report.filePath) : 'unknown';
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
    
    const enhancedReport = {
      ...report,
      filename,
      mimeType,
      // Include a full URL for easy frontend access
      fullFileUrl: `${req.protocol}://${req.get('host')}${report.fileUrl}`
    };
    
    res.json({
      success: true,
      report: enhancedReport
    });
  } catch (err) { 
    logger.error(`Error retrieving report: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 4. Update report details
exports.updateReport = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, notes } = req.body;
    const file = req.file; // This is populated by multer if a new file is uploaded
    
    // Get authenticated user info
    const patientId = req.user?.patientId;
    
    // Validate authentication - only patients can update their reports
    if (!patientId) {
      // Clean up any uploaded file if authentication fails
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      logger.warn('Attempt to update report without patient authentication');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in as a patient to update reports' 
      });
    }
    
    // Verify that the patient ID exists in the database
    try {
      const patientExists = await prisma.patientProfile.findFirst({
        where: { id: patientId }
      });
      
      if (!patientExists) {
        // If a file was uploaded but patient doesn't exist, remove the file
        if (file && file.path) {
          await deleteFile(file.path);
        }
        
        logger.warn(`Security alert: Update attempt with non-existent patientId: ${patientId}`);
        return res.status(403).json({ 
          success: false,
          error: 'Invalid patient ID',
          message: 'You are not authorized to update reports'
        });
      }
    } catch (dbError) {
      // If a file was uploaded but database check failed, remove the file
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      logger.error(`Database error during patient verification: ${dbError.message}`);
      throw dbError; // Let the error handler catch this
    }
    
    // Check if the report exists
    const report = await prisma.report.findUnique({
      where: { id }
    });
    
    if (!report) {
      // Clean up any uploaded file if report doesn't exist
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      return res.status(404).json({ 
        success: false,
        error: 'Report not found',
        message: 'The report you are trying to update does not exist'
      });
    }
    
    // Security check: Patients can only update their own reports
    if (report.patientId !== patientId) {
      // Clean up any uploaded file if security check fails
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      logger.warn(`Security alert: Patient ${patientId} attempted to update report ${id} belonging to patient ${report.patientId}`);
      
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'You can only update your own reports' 
      });
    }
    
    // Validate input fields if provided
    if (title && (title.length < 3 || title.length > 100)) {
      // Clean up any uploaded file if validation fails
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'Invalid title',
        message: 'Title must be between 3 and 100 characters'
      });
    }
    
    if (notes !== undefined && notes && notes.length > 1000) {
      // Clean up any uploaded file if validation fails
      if (file && file.path) {
        await deleteFile(file.path);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'Notes too long',
        message: 'Notes must be less than 1000 characters'
      });
    }
    
    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    
    // If a new file is uploaded, update file info
    if (file) {
      const fileUrl = `/uploads/reports/${path.basename(file.path)}`;
      const oldFilePath = report.filePath;
      
      updateData.fileUrl = fileUrl;
      updateData.filePath = file.path;
      
      // Track this file update
      trackFileUpload(file, {
        reportId: id,
        patientId: patientId,
        title: title || report.title,
        updateOperation: true
      });
      
      // After successful database update, delete the old file
      if (oldFilePath && oldFilePath !== file.path) {
        await deleteFile(oldFilePath);
      }
    }
    
    // Update the report in the database
    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        Feedback: true
      }
    });
      logger.info(`Report ${id} updated by patient ${patientId}`);
    
    // Enhance report with file metadata
    const enhancedReport = {
      ...updatedReport
    };
    
    if (file) {
      enhancedReport.fileSize = file.size;
      enhancedReport.mimeType = file.mimetype;
      enhancedReport.filename = path.basename(file.path);
    } else if (updatedReport.filePath) {
      // Extract info from existing path
      enhancedReport.filename = path.basename(updatedReport.filePath);
      
      // Guess mime type from file extension
      const extension = path.extname(enhancedReport.filename).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
      };
      
      enhancedReport.mimeType = mimeTypes[extension] || 'application/octet-stream';
    }
    
    // Add full URL for convenience
    enhancedReport.fullFileUrl = `${req.protocol}://${req.get('host')}${updatedReport.fileUrl}`;
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      report: enhancedReport
    });
  } catch (err) { 
    // Clean up any uploaded file if there's an error
    if (req.file && req.file.path) {
      await deleteFile(req.file.path);
    }
    
    logger.error(`Error updating report: ${err.message}`, {
      stack: err.stack
    });
    next(err); 
  }
};

// 5. Delete a report
exports.deleteReport = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Get authenticated user info
    const patientId = req.user?.patientId;
    
    // Validate authentication - only patients can delete their reports
    if (!patientId) {
      logger.warn('Attempt to delete report without patient authentication');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        message: 'You must be logged in as a patient to delete reports' 
      });
    }
    
    // Verify that the patient ID exists in the database
    try {
      const patientExists = await prisma.patientProfile.findFirst({
        where: { id: patientId }
      });
      
      if (!patientExists) {
        logger.warn(`Security alert: Delete attempt with non-existent patientId: ${patientId}`);
        return res.status(403).json({ 
          success: false,
          error: 'Invalid patient ID',
          message: 'You are not authorized to delete reports'
        });
      }
    } catch (dbError) {
      logger.error(`Database error during patient verification: ${dbError.message}`);
      throw dbError; // Let the error handler catch this
    }
    
    // Check if the report exists
    const report = await prisma.report.findUnique({
      where: { id }
    });
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        error: 'Report not found',
        message: 'The report you are trying to delete does not exist' 
      });
    }
    
    // Security check: Patients can only delete their own reports
    if (report.patientId !== patientId) {
      logger.warn(`Security alert: Patient ${patientId} attempted to delete report ${id} belonging to patient ${report.patientId}`);
      
      return res.status(403).json({ 
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own reports' 
      });
    }
    
    // Create a record of the deleted file for audit purposes
    const deleteRecord = {
      reportId: id,
      patientId: patientId,
      title: report.title,
      filePath: report.filePath,
      timestamp: new Date().toISOString(),
      action: 'delete'
    };
    
    logger.info(`Report deletion request: ${JSON.stringify(deleteRecord)}`);
    
    // Use a transaction to ensure both the database records and file are cleaned up
    await prisma.$transaction(async (prismaClient) => {
      // Delete associated feedback first
      await prismaClient.feedback.deleteMany({
        where: { reportId: id }
      });
      
      // Then delete the report record
      await prismaClient.report.delete({
        where: { id }
      });
    });
    
    // After the database transaction succeeds, delete the physical file
    if (report.filePath) {
      await deleteFile(report.filePath);
    }
    
    logger.info(`Report ${id} deleted by patient ${patientId}`);
    
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