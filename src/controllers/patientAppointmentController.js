// src/controllers/patientAppointmentController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const appointmentService = require('../services/appointmentService');
const { utcToZonedTime, format } = require('date-fns-tz');

// Timezone for Asia/Kolkata
const TIMEZONE = 'Asia/Kolkata';

/**
 * Book a new appointment from patient dashboard
 * Uses available time slots from the database
 */
exports.bookPatientAppointment = async (req, res, next) => {
  try {
    const { timeSlotId, reason, notes } = req.body;
    
    // Get patient ID from the authenticated user token
    const patientId = req.user?.patientId;
    
    // Validate inputs
    if (!patientId) {
      logger.warn('Missing patient ID in appointment creation');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        details: 'You must be logged in as a patient to book an appointment',
        code: 'PATIENT_ID_MISSING'
      });
    }
    
    if (!timeSlotId) {
      logger.warn(`Missing time slot ID in appointment creation for patient: ${patientId}`);
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field',
        details: 'Time slot ID is required',
        code: 'TIME_SLOT_MISSING'
      });
    }
    
    // Validate timeSlotId is a number
    if (isNaN(Number(timeSlotId))) {
      logger.warn(`Invalid time slot ID format in appointment creation for patient: ${patientId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        details: 'Time slot ID must be a number',
        code: 'INVALID_TIME_SLOT_ID'
      });
    }
      try {
      logger.info(`Creating appointment for patient ${patientId} with time slot ${timeSlotId}`);
      const appointment = await appointmentService.bookAppointment(patientId, timeSlotId, reason);
      
      // If notes are provided, update the appointment with notes
      if (notes) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { notes }
        });
      }
      
      // Get time slot with admin info
      const timeSlotWithDetails = await prisma.timeSlot.findUnique({
        where: { id: Number(timeSlotId) },
        include: {
          availabilities: {
            include: {
              admin: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });
      
      // Get first admin's information (assuming at least one is available)
      let adminInfo = { fullName: 'Unknown', specialty: '' };
      
      if (timeSlotWithDetails?.availabilities?.length > 0) {
        const firstAvailability = timeSlotWithDetails.availabilities[0];
        const adminProfile = await prisma.adminProfile.findFirst({
          where: { 
            email: {
              equals: (await prisma.user.findUnique({
                where: { id: firstAvailability.adminId }
              }))?.email
            }
          },
          select: {
            fullName: true,
            specialty: true
          }
        });
        
        if (adminProfile) {
          adminInfo = adminProfile;
        }
      }
      
      // Format dates
      const zonedStartTime = utcToZonedTime(timeSlotWithDetails.startTime, TIMEZONE);
      const zonedEndTime = utcToZonedTime(timeSlotWithDetails.endTime, TIMEZONE);
      const zonedDate = utcToZonedTime(timeSlotWithDetails.date, TIMEZONE);
      
      // Enhanced appointment details to return to frontend
      const enhancedAppointment = {
        ...appointment,
        adminName: adminInfo.fullName || 'Unknown',
        adminSpecialty: adminInfo.specialty || '',
        formattedDate: format(zonedDate, 'EEEE, MMMM d, yyyy'),
        formattedTime: `${format(zonedStartTime, 'h:mm a')} - ${format(zonedEndTime, 'h:mm a')}`,
        startTime: format(zonedStartTime, 'HH:mm'),
        endTime: format(zonedEndTime, 'HH:mm')
      };
      
      logger.info(`Appointment created successfully: ID ${appointment.id} for patient ${patientId}`);
      
      return res.status(201).json({ 
        success: true,
        message: 'Appointment booked successfully',
        appointment: enhancedAppointment
      });
    } catch (error) {
      // Handle known business logic errors from the service
      if (error.message === 'Time slot not found') {
        logger.warn(`Time slot not found for ID ${timeSlotId}`);
        return res.status(404).json({ 
          success: false,
          error: error.message,
          code: 'TIME_SLOT_NOT_FOUND'
        });
      } else if (error.message === 'Time slot is not available' || 
                error.message === 'Time slot is no longer available') {
        logger.warn(`Time slot ${timeSlotId} is no longer available`);
        return res.status(409).json({ 
          success: false,
          error: error.message,
          details: 'This time slot has been booked by another patient',
          code: 'TIME_SLOT_UNAVAILABLE'
        });
      } else if (error.message === 'Invalid patient ID') {
        logger.warn(`Invalid patient ID in appointment creation: ${patientId}`);
        return res.status(400).json({ 
          success: false,
          error: error.message,
          code: 'INVALID_PATIENT_ID'
        });
      } else if (error.message === 'Invalid time slot ID') {
        logger.warn(`Invalid time slot ID in appointment creation: ${timeSlotId}`);
        return res.status(400).json({ 
          success: false,
          error: error.message,
          code: 'INVALID_TIME_SLOT_ID'
        });
      }
      
      // Log unexpected errors
      logger.error(`Error creating appointment: ${error.message}`, {
        stack: error.stack,
        patientId,
        timeSlotId
      });
      
      // Return a generic error message
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create appointment',
        message: 'An unexpected error occurred. Please try again later.',
        code: 'APPOINTMENT_CREATION_FAILED'
      });
    }
  } catch (err) {
    logger.error(`Unhandled error in bookPatientAppointment: ${err.message}`, {
      stack: err.stack
    });
    next(err);
  }
};

/**
 * Get upcoming appointments for a patient
 */
exports.getPatientAppointments = async (req, res, next) => {
  try {
    const patientId = req.user?.patientId;
    
    // Validate patient ID
    if (!patientId) {
      logger.warn('Missing patient ID in get appointments request');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication error',
        details: 'You must be logged in as a patient to view appointments',
        code: 'PATIENT_ID_MISSING'
      });
    }
    
    // Parse query parameters
    const { status } = req.query;
    
    // Build filters
    const filters = { patientId };
    if (status) filters.status = status;
    
    // Get appointments from service
    const appointments = await appointmentService.getAppointments(filters);
    
    // Enhance appointments with additional information
    const enhancedAppointments = await Promise.all(appointments.map(async (appointment) => {
      // Get time slot details including admin information
      const timeSlotWithAdmin = await prisma.timeSlot.findUnique({
        where: { id: appointment.timeSlotId },
        include: {
          admin: {
            select: {
              id: true,
              fullName: true,
              email: true,
              specialty: true
            }
          }
        }
      });
      
      // Format appointment for frontend display
      return {
        ...appointment,
        adminName: timeSlotWithAdmin?.admin?.fullName || 'Unknown',
        adminSpecialty: timeSlotWithAdmin?.admin?.specialty || '',
        adminId: timeSlotWithAdmin?.admin?.id,
        formattedDate: new Date(timeSlotWithAdmin.slotDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
        formattedTime: new Date(timeSlotWithAdmin.slotTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        isPending: appointment.status === 'PENDING',
        isConfirmed: appointment.status === 'CONFIRMED',
        isCancelled: appointment.status === 'CANCELLED',
        isCompleted: appointment.status === 'COMPLETED',
        isNoShow: appointment.status === 'NO_SHOW'
      };
    }));
    
    logger.info(`Retrieved ${enhancedAppointments.length} appointments for patient ${patientId}`);
    
    return res.json({
      success: true,
      count: enhancedAppointments.length,
      appointments: enhancedAppointments
    });
  } catch (error) {
    logger.error(`Error getting patient appointments: ${error.message}`, {
      stack: error.stack,
      patientId: req.user?.patientId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve appointments',
      message: error.message || 'An unexpected error occurred',
      code: 'APPOINTMENT_RETRIEVAL_FAILED'
    });
  }
};

/**
 * Cancel a patient appointment
 */
exports.cancelPatientAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientId = req.user?.patientId;
    
    // Validate patient ID
    if (!patientId) {
      logger.warn('Missing patient ID in cancel appointment request');
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        details: 'You must be logged in as a patient to cancel appointments',
        code: 'PATIENT_ID_MISSING'
      });
    }
    
    // Validate appointment ID
    if (!id || isNaN(Number(id))) {
      logger.warn(`Invalid appointment ID in cancel request: ${id}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid appointment ID',
        details: 'Appointment ID must be a valid number',
        code: 'INVALID_APPOINTMENT_ID'
      });
    }
    
    // Check if the appointment belongs to the patient
    const appointment = await appointmentService.getAppointmentById(Number(id));
    
    if (!appointment) {
      logger.warn(`Appointment not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND'
      });
    }
    
    if (appointment.patientId !== patientId) {
      logger.warn(`Security alert: Patient ${patientId} attempted to cancel appointment ${id} belonging to patient ${appointment.patientId}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        details: 'You can only cancel your own appointments',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Cancel the appointment
    const cancelledAppointment = await appointmentService.cancelAppointment(Number(id));
    
    logger.info(`Appointment ${id} cancelled successfully by patient ${patientId}`);
    
    return res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: cancelledAppointment
    });
  } catch (error) {
    logger.error(`Error cancelling appointment: ${error.message}`, {
      stack: error.stack,
      appointmentId: req.params.id,
      patientId: req.user?.patientId
    });
    
    let statusCode = 500;
    let errorCode = 'APPOINTMENT_CANCELLATION_FAILED';
    
    if (error.message === 'Appointment not found') {
      statusCode = 404;
      errorCode = 'APPOINTMENT_NOT_FOUND';
    } else if (error.message.startsWith('Cannot cancel an appointment with status:')) {
      statusCode = 400;
      errorCode = 'INVALID_CANCELLATION';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to cancel appointment',
      code: errorCode
    });
  }
};
