// src/services/appointmentService.js
const { prisma } = require('../config');

/**
 * Book a new appointment
 * @param {number} patientId - ID of the patient
 * @param {number} timeSlotId - ID of the time slot
 * @param {string} reason - Optional reason for the appointment
 * @returns {Promise<Object>} Created appointment
 */
async function bookAppointment(patientId, timeSlotId, reason = null) {
  // Validate input parameters
  if (!patientId || isNaN(Number(patientId))) {
    throw new Error('Invalid patient ID');
  }
  
  if (!timeSlotId || isNaN(Number(timeSlotId))) {
    throw new Error('Invalid time slot ID');
  }
  
  // Convert to proper number types for database operations
  const patientIdNum = Number(patientId);
  const timeSlotIdNum = Number(timeSlotId);
  
  try {
    // Check if the time slot exists and has at least one admin available
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotIdNum },
      include: {
        availabilities: true,
        appointment: true
      }
    });
    
    if (!timeSlot) {
      throw new Error('Time slot not found');
    }
    
    if (timeSlot.isLocked) {
      throw new Error('Time slot is locked');
    }
    
    if (timeSlot.appointment) {
      throw new Error('Time slot already has an appointment');
    }
    
    if (timeSlot.availabilities.length === 0) {
      throw new Error('No admin available for this time slot');
    }
    
    // Use a transaction with pessimistic locking to prevent race conditions
    const [appointment, _] = await prisma.$transaction(async (prismaClient) => {
      // Double-check the slot is still available (for race conditions)
      const currentSlot = await prismaClient.timeSlot.findUnique({
        where: { id: timeSlotIdNum },
        include: {
          appointment: true
        }
      });
      
      if (!currentSlot) {
        throw new Error('Time slot not found');
      }
      
      if (currentSlot.isLocked) {
        throw new Error('Time slot is now locked');
      }
      
      if (currentSlot.appointment) {
        throw new Error('Time slot has been booked by another patient');
      }
      
      // Create the appointment
      const newAppointment = await prismaClient.appointment.create({
        data: {
          patientId: patientIdNum,
          timeSlotId: timeSlotIdNum,
          status: 'PENDING',
          bookedAt: new Date()
        }
      });
      
      // Mark the time slot as locked
      const updatedSlot = await prismaClient.timeSlot.update({
        where: { id: timeSlotIdNum },
        data: { isLocked: true }
      });
      
      return [newAppointment, updatedSlot];
    }, {
      timeout: 10000 // 10 second timeout for the transaction
    });
    
    return appointment;
  } catch (error) {
    // Enhance error message with more detail
    if (error.code === 'P2025') {
      throw new Error('Time slot not found or no longer available');
    } else if (error.code === 'P2003') {
      throw new Error('Invalid patient ID or time slot ID');
    } else if (error.code === 'P2002') {
      throw new Error('This time slot has already been booked');
    }
    throw error;
  }
}

/**
 * Get appointments with filtering options
 * @param {Object} filters - Filter criteria
 * @param {number} filters.patientId - Filter by patient ID
 * @param {number} filters.adminId - Filter by admin ID
 * @param {string} filters.status - Filter by status
 * @param {Date} filters.date - Filter by date
 * @returns {Promise<Array>} List of appointments
 */
async function getAppointments(filters = {}) {
  try {
    const { patientId, adminId, status, date } = filters;
    
    // Build query conditions with proper type conversion
    const where = {};
    
    if (patientId !== undefined) {
      if (isNaN(Number(patientId))) {
        throw new Error('Invalid patient ID format');
      }
      where.patientId = Number(patientId);
    }
    
    if (status) {
      // Validate status is one of the allowed values
      const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
      }
      where.status = status;
    }
    
    // For filtering by admin, we need to join with timeSlot
    let timeSlotWhere = {};
    
    if (adminId !== undefined) {
      if (isNaN(Number(adminId))) {
        throw new Error('Invalid admin ID format');
      }
      timeSlotWhere.adminId = Number(adminId);
    }
    
    if (date) {
      let queryDate;
      try {
        queryDate = new Date(date);
        if (isNaN(queryDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (err) {
        throw new Error('Invalid date format');
      }
      
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      timeSlotWhere.slotDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    // Include the timeSlot relation if we have conditions for it
    const include = {
      timeSlot: true
    };
    
    if (Object.keys(timeSlotWhere).length > 0) {
      where.timeSlot = timeSlotWhere;
    }
    
    // Get appointments with included relations
    return await prisma.appointment.findMany({
      where,
      include,
      orderBy: {
        bookedAt: 'desc'
      }
    });
  } catch (error) {
    // Transform Prisma errors into more readable errors
    if (error.code === 'P2003') {
      throw new Error('Invalid foreign key constraint: Check patient or admin ID');
    } else if (error.code === 'P2006') {
      throw new Error('Invalid data provided in the query');
    }
    throw error;
  }
}

/**
 * Get appointment by ID
 * @param {number} id - Appointment ID
 * @returns {Promise<Object|null>} Appointment or null if not found
 */
async function getAppointmentById(id) {
  // Enhanced validation for ID parameter
  if (id === undefined || id === null) {
    throw new Error('Appointment ID is required');
  }
  
  if (isNaN(Number(id))) {
    throw new Error('Invalid appointment ID format');
  }
  
  const appointmentId = Number(id);
  
  try {
    return await prisma.appointment.findUnique({
      where: { 
        id: appointmentId 
      },
      include: { 
        timeSlot: true,
        patient: true
      }
    });
  } catch (error) {
    // Convert Prisma errors to more readable errors
    if (error.code === 'P2025') {
      return null; // Not found
    }
    throw error;
  }
}

/**
 * Update appointment status
 * @param {number} id - Appointment ID
 * @param {Object} data - Update data
 * @param {string} data.status - New status
 * @param {string} data.reason - New reason
 * @returns {Promise<Object>} Updated appointment
 */
async function updateAppointment(id, data) {
  if (!id || isNaN(Number(id))) {
    throw new Error('Invalid appointment ID');
  }
  
  const appointmentId = Number(id);
  
  // Validate data object
  if (!data || (typeof data !== 'object')) {
    throw new Error('Invalid update data');
  }
  
  const { status, reason } = data;
  
  // Validate status if provided
  if (status) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  try {
    // Check if the appointment exists
    const appointment = await getAppointmentById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    // Prepare update data - only include valid fields
    const updateData = {};
    if (status) updateData.status = status;
    if (reason !== undefined) updateData.reason = reason;
    
    // If there's nothing to update, return the current appointment
    if (Object.keys(updateData).length === 0) {
      return appointment;
    }
    
    // Handle special status changes
    if (status === 'CANCELLED' && ['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      // Use the cancelAppointment function for proper handling of time slot availability
      return await cancelAppointment(appointmentId);
    }
    
    // Update the appointment normally for other cases
    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: { timeSlot: true }
    });
  } catch (error) {
    // Transform Prisma errors into more readable errors
    if (error.code === 'P2025') {
      throw new Error('Appointment not found');
    } else if (error.code === 'P2003') {
      throw new Error('Invalid appointment ID');
    }
    throw error;
  }
}

/**
 * Cancel an appointment
 * @param {number} id - Appointment ID
 * @returns {Promise<Object>} Cancelled appointment
 */
async function cancelAppointment(id) {
  if (!id || isNaN(Number(id))) {
    throw new Error('Invalid appointment ID');
  }
  
  const appointmentId = Number(id);
  
  try {
    // Check if the appointment exists
    const appointment = await getAppointmentById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    // Only allow cancellation of pending or confirmed appointments
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new Error(`Cannot cancel an appointment with status: ${appointment.status}`);
    }
    
    // Use a transaction with error handling to ensure both operations complete or fail together
    const [updatedAppointment, _] = await prisma.$transaction(async (prismaClient) => {
      // Verify the appointment hasn't been modified since we fetched it
      const currentAppointment = await prismaClient.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true }
      });
      
      if (!currentAppointment) {
        throw new Error('Appointment no longer exists');
      }
      
      if (!['PENDING', 'CONFIRMED'].includes(currentAppointment.status)) {
        throw new Error(`Cannot cancel an appointment with status: ${currentAppointment.status}`);
      }
      
      // Update appointment status to CANCELLED
      const cancelled = await prismaClient.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }
      });
      
      // Make the time slot available again
      const updatedSlot = await prismaClient.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: { isAvailable: true }
      });
      
      return [cancelled, updatedSlot];
    }, {
      timeout: 10000 // 10 second timeout for the transaction
    });
    
    return updatedAppointment;
  } catch (error) {
    // Transform Prisma errors into more readable errors
    if (error.code === 'P2025') {
      throw new Error('Appointment or time slot not found');
    } else if (error.code === 'P2003') {
      throw new Error('Invalid appointment ID or time slot ID');
    }
    throw error;
  }
}

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment
};