// src/controllers/reportController.js
const { prisma } = require('../config');

// 1. Upload a new report
exports.uploadReport = async (req, res, next) => {
  try {
    const { patientId, title, notes, fileUrl } = req.body;
    
    // Validate required fields
    if (!patientId || !title || !fileUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create report record
    const report = await prisma.report.create({
      data: {
        patientId,
        title,
        notes,
        fileUrl,
        uploadedAt: new Date()
      }
    });
    
    res.status(201).json(report);
  } catch (err) { next(err); }
};

// 2. Get all reports (with filtering)
exports.getReports = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    
    // Build query conditions
    const where = {};
    
    if (patientId) {
      where.patientId = Number(patientId);
    }
    
    // Get reports
    const reports = await prisma.report.findMany({
      where,
      orderBy: {
        uploadedAt: 'desc'
      },
      include: {
        Feedback: true // Include associated feedback
      }
    });
    
    res.json(reports);
  } catch (err) { next(err); }
};

// 3. Get a specific report
exports.getReportById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        Feedback: true // Include associated feedback
      }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) { next(err); }
};

// 4. Update report details
exports.updateReport = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, notes } = req.body;
    
    // Check if the report exists
    const report = await prisma.report.findUnique({
      where: { id }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update the report
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        title,
        notes
      },
      include: {
        Feedback: true
      }
    });
    
    res.json(updatedReport);
  } catch (err) { next(err); }
};

// 5. Delete a report
exports.deleteReport = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Check if the report exists
    const report = await prisma.report.findUnique({
      where: { id }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Delete associated feedback first
    await prisma.feedback.deleteMany({
      where: { reportId: id }
    });
    
    // Then delete the report
    await prisma.report.delete({
      where: { id }
    });
    
    res.json({ message: 'Report deleted successfully' });
  } catch (err) { next(err); }
};