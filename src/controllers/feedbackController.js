// src/controllers/feedbackController.js
const { prisma } = require('../config');

// 1. Add feedback to a report
exports.addFeedback = async (req, res, next) => {
  try {
    const { reportId, adminId, message } = req.body;
    
    // Validate required fields
    if (!reportId || !adminId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if the report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        reportId,
        adminId,
        message,
        createdAt: new Date()
      }
    });
    
    res.status(201).json(feedback);
  } catch (err) { next(err); }
};

// 2. Get feedback for a specific report
exports.getFeedbackByReport = async (req, res, next) => {
  try {
    const reportId = Number(req.query.reportId);
    
    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }
    
    const feedback = await prisma.feedback.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(feedback);
  } catch (err) { next(err); }
};

// 3. Get all feedback by a specific admin
exports.getFeedbackByAdmin = async (req, res, next) => {
  try {
    const adminId = Number(req.query.adminId);
    
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }
    
    const feedback = await prisma.feedback.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      include: { Report: true }
    });
    
    res.json(feedback);
  } catch (err) { next(err); }
};

// 4. Get a specific feedback by ID
exports.getFeedbackById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: { Report: true }
    });
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (err) { next(err); }
};

// 5. Update feedback
exports.updateFeedback = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body;
    
    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { message }
    });
    
    res.json(updatedFeedback);
  } catch (err) { next(err); }
};

// 6. Delete feedback
exports.deleteFeedback = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    // Delete feedback
    await prisma.feedback.delete({
      where: { id }
    });
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) { next(err); }
};