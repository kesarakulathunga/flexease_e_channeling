// src/controllers/appointmentController.js
const { prisma } = require('../config');
const appointmentService = require('../services/appointmentService');

// 1. Book a new appointment
exports.createAppointment = async (req, res, next) => {
  try {
    const { patientId, timeSlotId, reason } = req.body;
    
    // Validate required fields
    if (!patientId || !timeSlotId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
      const appointment = await appointmentService.bookAppointment(patientId, timeSlotId, reason);
      res.status(201).json(appointment);
    } catch (error) {
      if (error.message === 'Time slot not found') {
        return res.status(404).json({ error: error.message });
      } else if (error.message === 'Time slot is not available') {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  } catch (err) { next(err); }
};

// 2. Get all appointments (with filtering options)
exports.getAppointments = async (req, res, next) => {
  try {
    const { patientId, adminId, status, date } = req.query;
    
    const filters = {
      patientId: patientId ? Number(patientId) : undefined,
      adminId: adminId ? Number(adminId) : undefined,
      status,
      date: date ? new Date(date) : undefined
    };
    
    const appointments = await appointmentService.getAppointments(filters);
    
    res.json(appointments);
  } catch (err) { next(err); }
};

// 3. Get a specific appointment
exports.getAppointmentById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    const appointment = await appointmentService.getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (err) { next(err); }
};

// 4. Update appointment status
exports.updateAppointment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, reason } = req.body;
    
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, { status, reason });
      res.json(updatedAppointment);
    } catch (error) {
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: error.message });
      }
      throw error;
    }
  } catch (err) { next(err); }
};

// 5. Cancel an appointment
exports.cancelAppointment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    try {
      const cancelledAppointment = await appointmentService.cancelAppointment(id);
      res.json({ 
        message: 'Appointment cancelled successfully', 
        appointment: cancelledAppointment 
      });
    } catch (error) {
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: error.message });
      } else if (error.message.startsWith('Cannot cancel an appointment with status:')) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  } catch (err) { next(err); }
};