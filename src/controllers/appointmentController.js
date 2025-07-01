// src/controllers/appointmentController.js
const { prisma } = require('../config');
const appointmentService = require('../services/appointmentService');

// 1. Book a new appointment
exports.createAppointment = async (req, res, next) => {
  try {
    const { timeSlotId, reason } = req.body;
    
    // Get patient ID from the authenticated user token
    const patientId = req.user?.patientId;
    
    // Enhanced validation with detailed error messages
    if (!patientId) {
      return res.status(401).json({ 
        error: 'Authentication error',
        details: 'You must be logged in as a patient to book an appointment',
        code: 'PATIENT_ID_MISSING'
      });
    }
    
    if (!timeSlotId) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'Time slot ID is required',
        code: 'TIME_SLOT_MISSING'
      });
    }
    
    // Validate timeSlotId is a number
    if (isNaN(Number(timeSlotId))) {
      return res.status(400).json({
        error: 'Invalid data format',
        details: 'Time slot ID must be a number',
        code: 'INVALID_TIME_SLOT_ID'
      });
    }
    
    try {
      const appointment = await appointmentService.bookAppointment(patientId, timeSlotId, reason);
      
      // Log successful booking
      console.log(`Appointment created successfully: ID ${appointment.id} for patient ${patientId}`);
      
      return res.status(201).json({ 
        success: true,
        message: 'Appointment booked successfully',
        appointment 
      });
    } catch (error) {
      // Handle known business logic errors from the service
      if (error.message === 'Time slot not found') {
        return res.status(404).json({ 
          error: error.message,
          code: 'TIME_SLOT_NOT_FOUND'
        });
      } else if (error.message === 'Time slot is not available' || 
                error.message === 'Time slot is no longer available') {
        return res.status(409).json({ 
          error: error.message,
          code: 'TIME_SLOT_UNAVAILABLE',
          details: 'This time slot has been booked by another patient'
        });
      } else if (error.message === 'Invalid patient ID') {
        return res.status(400).json({ 
          error: error.message,
          code: 'INVALID_PATIENT_ID'
        });
      } else if (error.message === 'Invalid time slot ID') {
        return res.status(400).json({ 
          error: error.message,
          code: 'INVALID_TIME_SLOT_ID'
        });
      }
      
      // Re-throw for the global error handler
      throw error;
    }
  } catch (err) { 
    console.error('Error creating appointment:', err);
    
    // Ensure we return a proper error response even if something unexpected happens
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to create appointment',
        message: err.message || 'An unexpected error occurred',
        code: 'APPOINTMENT_CREATION_FAILED'
      });
    } else {
      next(err);
    }
  }
};

// 2. Get all appointments (with filtering options)
exports.getAppointments = async (req, res, next) => {
  try {
    const { patientId, adminId, status, date } = req.query;
    
    // Validate query parameters if provided
    if (patientId && isNaN(Number(patientId))) {
      return res.status(400).json({
        error: 'Invalid patient ID format',
        details: 'Patient ID must be a number',
        code: 'INVALID_PATIENT_ID'
      });
    }
    
    if (adminId && isNaN(Number(adminId))) {
      return res.status(400).json({
        error: 'Invalid admin ID format',
        details: 'Admin ID must be a number',
        code: 'INVALID_ADMIN_ID'
      });
    }
    
    if (date) {
      try {
        const testDate = new Date(date);
        if (isNaN(testDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid date format',
          details: 'Please provide date in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT'
        });
      }
    }
    
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status value',
          details: `Status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        });
      }
    }
    
    // For patient users, always filter by their own ID for security
    const userPatientId = req.user?.patientId;
    
    // If the user is a patient, they can only see their own appointments
    const filterPatientId = req.user?.role === 'PATIENT' 
      ? userPatientId 
      : (patientId || undefined);
    
    // Build filters with proper validation
    const filters = {
      patientId: filterPatientId,
      adminId: adminId || undefined,
      status,
      date: date || undefined
    };
    
    try {
      const appointments = await appointmentService.getAppointments(filters);
      
      console.log(`Retrieved ${appointments.length} appointments with filters: ${JSON.stringify(filters)}`);
      
      return res.json({
        success: true,
        count: appointments.length,
        appointments
      });
    } catch (error) {
      // Handle specific business logic errors
      if (error.message === 'Invalid patient ID format') {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_PATIENT_ID'
        });
      } else if (error.message === 'Invalid admin ID format') {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_ADMIN_ID'
        });
      } else if (error.message === 'Invalid date format') {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_DATE_FORMAT'
        });
      } else if (error.message.startsWith('Invalid status value')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_STATUS'
        });
      }
      
      throw error;
    }
  } catch (err) { 
    console.error('Error fetching appointments:', err);
    
    // Ensure we return a proper error response if not already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to retrieve appointments',
        message: err.message || 'An unexpected error occurred',
        code: 'APPOINTMENT_RETRIEVAL_FAILED'
      });
    } else {
      next(err);
    }
  }
};

// 3. Get a specific appointment
exports.getAppointmentById = async (req, res, next) => {
  try {
    const idParam = req.params.id;
    
    // Enhanced validation for ID parameter
    if (!idParam) {
      return res.status(400).json({ 
        error: 'Missing appointment ID',
        details: 'Appointment ID is required in the request URL',
        code: 'MISSING_APPOINTMENT_ID'
      });
    }
    
    if (isNaN(Number(idParam))) {
      return res.status(400).json({ 
        error: 'Invalid appointment ID format',
        details: 'The ID must be a valid number',
        code: 'INVALID_APPOINTMENT_ID_FORMAT'
      });
    }
    
    const id = Number(idParam);
    
    try {
      const appointment = await appointmentService.getAppointmentById(id);
      
      // If the appointment doesn't exist
      if (!appointment) {
        return res.status(404).json({ 
          error: 'Appointment not found',
          details: `No appointment exists with ID ${id}`,
          code: 'APPOINTMENT_NOT_FOUND'
        });
      }
      
      // Enhanced security: ensure patients can only access their own appointments
      if (req.user?.role === 'PATIENT') {
        if (appointment.patientId !== req.user.patientId) {
          console.warn(`Security alert: Patient ${req.user.patientId} attempted to access appointment ${id} belonging to patient ${appointment.patientId}`);
          
          return res.status(403).json({ 
            error: 'Access denied',
            details: 'You can only access your own appointments',
            code: 'UNAUTHORIZED_ACCESS'
          });
        }
      }
      
      res.json(appointment);
    } catch (error) {
      // Handle known error types from the service
      if (error.message === 'Invalid appointment ID') {
        return res.status(400).json({ 
          error: error.message,
          details: 'The appointment ID must be a valid number',
          code: 'INVALID_APPOINTMENT_ID'
        });
      }
      
      // For other errors, pass to global error handler
      throw error;
    }
  } catch (err) { 
    console.error('Error getting appointment by ID:', err);
    
    // Ensure we return a proper error response if not already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to retrieve appointment',
        message: err.message || 'An unexpected error occurred',
        code: 'APPOINTMENT_RETRIEVAL_FAILED'
      });
    } else {
      next(err);
    }
  }
};

// 4. Update appointment status
exports.updateAppointment = async (req, res, next) => {
  try {
    const idParam = req.params.id;
    
    // Enhanced validation with detailed error messages
    if (!idParam) {
      return res.status(400).json({ 
        error: 'Missing appointment ID',
        details: 'Appointment ID is required in the request URL',
        code: 'MISSING_APPOINTMENT_ID'
      });
    }
    
    if (isNaN(Number(idParam))) {
      return res.status(400).json({ 
        error: 'Invalid appointment ID format',
        details: 'The ID must be a valid number',
        code: 'INVALID_APPOINTMENT_ID_FORMAT'
      });
    }
    
    const id = Number(idParam);
    const { status, reason } = req.body;
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status value',
          details: `Status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        });
      }
    }
    
    // Check authorization - patients can only update their own appointments
    if (req.user?.role === 'PATIENT') {
      try {
        const appointment = await appointmentService.getAppointmentById(id);
        
        if (!appointment) {
          return res.status(404).json({ 
            error: 'Appointment not found',
            code: 'APPOINTMENT_NOT_FOUND'
          });
        }
        
        if (appointment.patientId !== req.user.patientId) {
          console.warn(`Security alert: Patient ${req.user.patientId} attempted to update appointment ${id} belonging to patient ${appointment.patientId}`);
          
          return res.status(403).json({ 
            error: 'Access denied',
            details: 'You can only update your own appointments',
            code: 'UNAUTHORIZED_ACCESS'
          });
        }
        
        // For patients, limit the statuses they can set
        if (status && !['CANCELLED'].includes(status)) {
          return res.status(403).json({
            error: 'Forbidden operation',
            details: 'Patients can only cancel appointments',
            code: 'STATUS_CHANGE_FORBIDDEN'
          });
        }
      } catch (error) {
        if (error.message === 'Invalid appointment ID' || 
            error.message === 'Appointment not found') {
          return res.status(404).json({ 
            error: 'Appointment not found',
            code: 'APPOINTMENT_NOT_FOUND'
          });
        }
        throw error;
      }
    }
    
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, { status, reason });
      
      console.log(`Appointment ${id} updated successfully to status: ${status || 'unchanged'}`);
      
      return res.json({
        success: true,
        message: 'Appointment updated successfully',
        appointment: updatedAppointment
      });
    } catch (error) {
      // Handle specific business logic errors
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ 
          error: error.message,
          code: 'APPOINTMENT_NOT_FOUND'
        });
      } else if (error.message.startsWith('Invalid status value')) {
        return res.status(400).json({ 
          error: error.message,
          code: 'INVALID_STATUS'
        });
      } else if (error.message.startsWith('Cannot cancel an appointment with status:')) {
        return res.status(400).json({ 
          error: error.message,
          code: 'INVALID_STATUS_TRANSITION'
        });
      }
      
      throw error;
    }
  } catch (err) { 
    console.error('Error updating appointment:', err);
    
    // Ensure we return a proper error response if not already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to update appointment',
        message: err.message || 'An unexpected error occurred',
        code: 'APPOINTMENT_UPDATE_FAILED'
      });
    } else {
      next(err);
    }
  }
};

// 5. Cancel an appointment
exports.cancelAppointment = async (req, res, next) => {
  try {
    const idParam = req.params.id;
    
    // Enhanced validation with detailed error messages
    if (!idParam) {
      return res.status(400).json({ 
        error: 'Missing appointment ID',
        details: 'Appointment ID is required in the request URL',
        code: 'MISSING_APPOINTMENT_ID'
      });
    }
    
    if (isNaN(Number(idParam))) {
      return res.status(400).json({ 
        error: 'Invalid appointment ID format',
        details: 'The ID must be a valid number',
        code: 'INVALID_APPOINTMENT_ID_FORMAT'
      });
    }
    
    const id = Number(idParam);
    
    // Check authorization - patients can only cancel their own appointments
    if (req.user?.role === 'PATIENT') {
      try {
        const appointment = await appointmentService.getAppointmentById(id);
        
        if (!appointment) {
          return res.status(404).json({ 
            error: 'Appointment not found',
            code: 'APPOINTMENT_NOT_FOUND'
          });
        }
        
        if (appointment.patientId !== req.user.patientId) {
          console.warn(`Security alert: Patient ${req.user.patientId} attempted to cancel appointment ${id} belonging to patient ${appointment.patientId}`);
          
          return res.status(403).json({ 
            error: 'Access denied',
            details: 'You can only cancel your own appointments',
            code: 'UNAUTHORIZED_ACCESS'
          });
        }
      } catch (error) {
        if (error.message === 'Invalid appointment ID' || 
            error.message === 'Appointment not found') {
          return res.status(404).json({ 
            error: 'Appointment not found',
            code: 'APPOINTMENT_NOT_FOUND'
          });
        }
        throw error;
      }
    }
    
    try {
      const cancelledAppointment = await appointmentService.cancelAppointment(id);
      
      console.log(`Appointment ${id} cancelled successfully`);
      
      return res.json({ 
        success: true,
        message: 'Appointment cancelled successfully', 
        appointment: cancelledAppointment 
      });
    } catch (error) {
      // Handle specific business logic errors
      if (error.message === 'Appointment not found' || 
          error.message === 'Appointment no longer exists') {
        return res.status(404).json({ 
          error: 'Appointment not found',
          code: 'APPOINTMENT_NOT_FOUND'
        });
      } else if (error.message.startsWith('Cannot cancel an appointment with status:')) {
        return res.status(400).json({ 
          error: error.message,
          details: 'Only pending or confirmed appointments can be cancelled',
          code: 'INVALID_CANCELLATION'
        });
      }
      
      throw error;
    }
  } catch (err) { 
    console.error('Error cancelling appointment:', err);
    
    // Ensure we return a proper error response if not already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to cancel appointment',
        message: err.message || 'An unexpected error occurred',
        code: 'APPOINTMENT_CANCELLATION_FAILED'
      });
    } else {
      next(err);
    }
  }
};