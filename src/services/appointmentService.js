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
  // Check if the time slot exists and is available
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId }
  });
  
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }
  
  if (!timeSlot.isAvailable) {
    throw new Error('Time slot is not available');
  }
  
  // Use a transaction to ensure both operations complete or fail together
  const [appointment, _] = await prisma.$transaction([
    // Create the appointment
    prisma.appointment.create({
      data: {
        patientId,
        timeSlotId,
        reason,
        status: 'PENDING',
        bookedAt: new Date()
      }
    }),
    
    // Mark the time slot as unavailable
    prisma.timeSlot.update({
      where: { id: timeSlotId },
      data: { isAvailable: false }
    })
  ]);
  
  return appointment;
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
  const { patientId, adminId, status, date } = filters;
  
  // Build query conditions
  const where = {};
  
  if (patientId) {
    where.patientId = Number(patientId);
  }
  
  if (status) {
    where.status = status;
  }
  
  // For filtering by admin, we need to join with timeSlot
  let timeSlotWhere = {};
  
  if (adminId) {
    timeSlotWhere.adminId = Number(adminId);
  }
  
  if (date) {
    const queryDate = new Date(date);
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
  return prisma.appointment.findMany({
    where,
    include,
    orderBy: {
      bookedAt: 'desc'
    }
  });
}

/**
 * Get appointment by ID
 * @param {number} id - Appointment ID
 * @returns {Promise<Object|null>} Appointment or null if not found
 */
async function getAppointmentById(id) {
  return prisma.appointment.findUnique({
    where: { id: Number(id) },
    include: { timeSlot: true }
  });
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
  const { status, reason } = data;
  
  // Check if the appointment exists
  const appointment = await getAppointmentById(id);
  
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  
  // Update the appointment
  const updateData = {};
  if (status) updateData.status = status;
  if (reason) updateData.reason = reason;
  
  return prisma.appointment.update({
    where: { id: Number(id) },
    data: updateData,
    include: { timeSlot: true }
  });
}

/**
 * Cancel an appointment
 * @param {number} id - Appointment ID
 * @returns {Promise<Object>} Cancelled appointment
 */
async function cancelAppointment(id) {
  // Check if the appointment exists
  const appointment = await getAppointmentById(id);
  
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  
  // Only allow cancellation of pending or confirmed appointments
  if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
    throw new Error(`Cannot cancel an appointment with status: ${appointment.status}`);
  }
  
  // Use a transaction to ensure both operations complete or fail together
  const [updatedAppointment, _] = await prisma.$transaction([
    // Update appointment status to CANCELLED
    prisma.appointment.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' }
    }),
    
    // Make the time slot available again
    prisma.timeSlot.update({
      where: { id: appointment.timeSlotId },
      data: { isAvailable: true }
    })
  ]);
  
  return updatedAppointment;
}

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment
};