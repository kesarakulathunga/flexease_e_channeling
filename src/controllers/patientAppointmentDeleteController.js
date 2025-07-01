// src/controllers/patientAppointmentDeleteController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Delete all appointments for a specific patient
 * This endpoint allows deleting all appointments associated with a patient ID
 * without any restrictions on appointment status
 * 
 * @route POST /api/patient-appointments/delete-all
 * @param {number} patientId - The ID of the patient whose appointments should be deleted
 * @returns {Object} Response with success status and details of deleted appointments
 */
exports.deleteAllPatientAppointments = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    
    // Validate patient ID
    if (!patientId || isNaN(Number(patientId))) {
      logger.warn(`Invalid patient ID in delete request: ${patientId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID',
        details: 'Patient ID must be a valid number',
        code: 'INVALID_PATIENT_ID'
      });
    }
    
    const patientIdNum = Number(patientId);
    
    // Find all appointments for this patient
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientIdNum },
      include: { timeSlot: true }
    });
    
    if (!appointments || appointments.length === 0) {
      logger.info(`No appointments found for patient ID: ${patientIdNum}`);
      return res.status(404).json({
        success: false,
        error: 'No appointments found',
        details: `No appointments found for patient ID: ${patientIdNum}`,
        code: 'NO_APPOINTMENTS_FOUND'
      });
    }
    
    logger.info(`Found ${appointments.length} appointments for patient ID: ${patientIdNum}`);
    
    // Use a transaction to ensure all operations succeed or fail together
    const deletedAppointments = await prisma.$transaction(async (prismaClient) => {
      const results = [];
      
      // Process each appointment
      for (const appointment of appointments) {
        // Delete the appointment
        const deleted = await prismaClient.appointment.delete({
          where: { id: appointment.id }
        });
        
        // Update the time slot to be available again
        if (appointment.timeSlot) {
          await prismaClient.timeSlot.update({
            where: { id: appointment.timeSlotId },
            data: { 
              isLocked: false
            }
          });
        }
        
        results.push(deleted);
      }
      
      return results;
    });
    
    logger.info(`Successfully deleted ${deletedAppointments.length} appointments for patient ID: ${patientIdNum}`);
    
    // Return success response with details
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedAppointments.length} appointments for patient ID: ${patientIdNum}`,
      deletedCount: deletedAppointments.length,
      deletedAppointments: deletedAppointments.map(app => ({
        id: app.id,
        patientId: app.patientId,
        timeSlotId: app.timeSlotId,
        status: app.status,
        bookedAt: app.bookedAt,
        updatedAt: app.updatedAt
      }))
    });
    
  } catch (error) {
    logger.error(`Error deleting patient appointments: ${error.message}`, {
      stack: error.stack,
      patientId: req.body.patientId
    });
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
        details: 'One or more appointments could not be found',
        code: 'APPOINTMENT_NOT_FOUND'
      });
    }
    
    next(error);
  }
};
