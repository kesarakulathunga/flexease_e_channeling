// src/controllers/patientAppointmentController2.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const { toZonedTime, format } = require('date-fns-tz');

// Define the timezone for IST (Indian Standard Time)
const TIMEZONE = 'Asia/Kolkata'; // UTC+5:30

/**
 * Get all available time slots and patient's existing appointments
 * Returns a grid of dates and times with availability and booking status
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    // Get patient ID from JWT token - check both possible locations
    let patientId;

    // Check if patientId is in req.user.patientId (old format)
    if (req.user.patientId) {
      patientId = Number(req.user.patientId);
    }
    // Check if patientId is in req.user.userId (new format)
    else if (req.user.userId) {
      patientId = Number(req.user.userId);
    }

    if (isNaN(patientId)) {
      logger.warn('Invalid patient ID in request');
      logger.info(`Auth token contains: ${JSON.stringify(req.user)}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID'
      });
    }

    // Get date parameters from query string, if provided
    const { startDate: startDateParam, endDate: endDateParam } = req.query;

    // Default to current date if startDate is not provided
    let startDateObj;
    if (startDateParam) {
      // Create date in IST timezone
      startDateObj = new Date(`${startDateParam}T00:00:00+05:30`);
    } else {
      // Use current date in IST timezone
      const now = new Date();
      startDateObj = new Date(now);
      startDateObj.setHours(0, 0, 0, 0);
    }

    // Default to startDate + 4 days if endDate is not provided
    let endDateObj;
    if (endDateParam) {
      // Create date in IST timezone
      endDateObj = new Date(`${endDateParam}T23:59:59+05:30`);
    } else {
      // Use startDate + 4 days in IST timezone
      endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 4);
      endDateObj.setHours(23, 59, 59, 999);
    }

    // Validate dates
    if (startDateParam && isNaN(startDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD'
      });
    }

    if (endDateParam && isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid endDate format. Use YYYY-MM-DD'
      });
    }

    logger.info(`Fetching available slots for patient ${patientId} from ${startDateObj.toISOString()} to ${endDateObj.toISOString()}`);

    // Fetch all time slots that have admin availability
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        date: {
          gte: startDateObj,
          lte: endDateObj
        },
        // Has at least one admin availability
        availabilities: {
          some: {}
        }
      },
      include: {
        availabilities: {
          include: {
            admin: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        appointment: {
          select: {
            id: true,
            patientId: true,
            status: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    logger.info(`Found ${timeSlots.length} time slots in date range`);

    // Get admin info for all admins with available slots
    const adminIds = [...new Set(timeSlots.flatMap(slot =>
      slot.availabilities.map(avail => avail.adminId)
    ))];

    const admins = await prisma.adminProfile.findMany({
      where: {
        email: {
          in: (await prisma.user.findMany({
            where: { id: { in: adminIds } },
            select: { email: true }
          })).map(user => user.email)
        }
      },
      select: {
        email: true,
        fullName: true,
        specialty: true
      }
    });

    // Create a map for quick lookup
    const adminMap = {};
    admins.forEach(admin => {
      adminMap[admin.email] = admin;
    });

    // Create a map of dates and times for the grid
    const dateTimeGrid = {};

    // First, collect all unique dates and times
    const uniqueDates = new Set();
    const uniqueTimes = new Set();

    timeSlots.forEach(slot => {
      const zonedDate = toZonedTime(slot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(slot.startTime, TIMEZONE);

      const dateStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
      const timeStr = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

      uniqueDates.add(dateStr);
      uniqueTimes.add(timeStr);
    });

    // Sort dates and times
    const sortedDates = Array.from(uniqueDates).sort();
    const sortedTimes = Array.from(uniqueTimes).sort();

    // Initialize the grid with all dates and times
    sortedDates.forEach(date => {
      dateTimeGrid[date] = {};

      sortedTimes.forEach(time => {
        dateTimeGrid[date][time] = {
          available: false,
          booked: false,
          myBooking: false,
          appointmentId: null,
          timeSlotId: null,
          adminCount: 0,
          admins: []
        };
      });
    });

    // Fill in slot information
    timeSlots.forEach(slot => {
      const zonedDate = toZonedTime(slot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(slot.startTime, TIMEZONE);

      const dateStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
      const timeStr = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

      if (dateTimeGrid[dateStr] && dateTimeGrid[dateStr][timeStr]) {
        const cell = dateTimeGrid[dateStr][timeStr];

        // Set basic slot info
        cell.timeSlotId = slot.id;
        cell.adminCount = slot.availabilities.length;

        // Add admin info
        cell.admins = slot.availabilities.map(avail => {
          const adminEmail = avail.admin.email;
          const adminInfo = adminMap[adminEmail] || { fullName: 'Unknown', specialty: '' };

          return {
            adminId: avail.adminId,
            email: adminEmail,
            name: adminInfo.fullName || 'Unknown',
            specialty: adminInfo.specialty || ''
          };
        });

        // Check if the slot is available (has admin availability and no appointment)
        cell.available = slot.availabilities.length > 0 && !slot.appointment;

        // Check if the slot is booked
        if (slot.appointment) {
          cell.booked = true;
          cell.appointmentId = slot.appointment.id;
          cell.status = slot.appointment.status;

          // Check if this is the patient's own booking
          if (slot.appointment.patientId === patientId) {
            cell.myBooking = true;
          }
        }
      }
    });

    // Format dates for display
    const formattedDates = sortedDates.map(dateStr => {
      const date = new Date(dateStr);
      return {
        date: dateStr,
        displayDate: format(date, 'EEE, MMM d', { timeZone: TIMEZONE })
      };
    });

    // Format times for display
    const formattedTimes = sortedTimes.map(timeStr => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      return {
        time: timeStr,
        displayTime: format(date, 'h:mm a', { timeZone: TIMEZONE })
      };
    });

    // Count patient's appointments
    const myAppointments = timeSlots.filter(slot =>
      slot.appointment && slot.appointment.patientId === patientId
    );

    return res.status(200).json({
      success: true,
      data: {
        dates: formattedDates,
        times: formattedTimes,
        grid: dateTimeGrid,
        totalSlots: timeSlots.length,
        totalAvailableSlots: timeSlots.filter(slot => slot.availabilities.length > 0 && !slot.appointment).length,
        totalMyAppointments: myAppointments.length,
        dateRange: {
          startDate: format(startDateObj, 'yyyy-MM-dd', { timeZone: TIMEZONE }),
          endDate: format(endDateObj, 'yyyy-MM-dd', { timeZone: TIMEZONE })
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching available slots: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots',
      message: error.message
    });
  }
};

/**
 * Update patient's appointments
 * Books new appointments, keeps existing ones, and cancels others
 */
exports.updateAppointments = async (req, res, next) => {
  try {
    const { selectedSlots } = req.body;

    // Get patient ID from JWT token - check both possible locations
    let patientId;

    // Check if patientId is in req.user.patientId (old format)
    if (req.user.patientId) {
      patientId = Number(req.user.patientId);
    }
    // Check if patientId is in req.user.userId (new format)
    else if (req.user.userId) {
      patientId = Number(req.user.userId);
    }

    if (isNaN(patientId)) {
      logger.warn('Invalid patient ID in request');
      logger.info(`Auth token contains: ${JSON.stringify(req.user)}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID'
      });
    }

    // If selectedSlots is null or not an array, initialize it as an empty array
    if (!selectedSlots || !Array.isArray(selectedSlots)) {
      selectedSlots = [];
    }

    // Log the number of selected slots
    logger.info(`Patient ${patientId} updating appointments with ${selectedSlots.length} selected slots`);

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Get all current appointments for this patient
      const currentAppointments = await tx.appointment.findMany({
        where: { patientId },
        include: {
          timeSlot: true
        }
      });

      // Create a map of current appointments for easy lookup
      const currentAppointmentMap = new Map();
      currentAppointments.forEach(appt => {
        currentAppointmentMap.set(appt.timeSlotId, {
          appointmentId: appt.id,
          timeSlotId: appt.timeSlotId
        });
      });

      // Step 2: Create a map of selected slots for easy lookup
      const selectedSlotMap = new Map();
      selectedSlots.forEach(slot => {
        if (slot.timeSlotId) {
          selectedSlotMap.set(Number(slot.timeSlotId), slot);
        }
      });

      // Step 3: Determine which appointments to add and which to remove
      const slotsToBook = [];
      const appointmentsToCancel = [];
      const appointmentsToKeep = [];

      // Find appointments to cancel (in current but not in selected)
      for (const [timeSlotId, value] of currentAppointmentMap.entries()) {
        if (!selectedSlotMap.has(timeSlotId)) {
          appointmentsToCancel.push(value.appointmentId);
        } else {
          appointmentsToKeep.push(value.appointmentId);
        }
      }

      // Find slots to book (in selected but not in current)
      for (const [timeSlotId, slot] of selectedSlotMap.entries()) {
        if (!currentAppointmentMap.has(timeSlotId)) {
          slotsToBook.push(timeSlotId);
        }
      }

      // Step 4: Verify that all slots to book are available
      const slotsToVerify = await tx.timeSlot.findMany({
        where: {
          id: { in: slotsToBook },
        },
        include: {
          availabilities: true,
          appointment: true
        }
      });

      const unavailableSlots = [];

      for (const slot of slotsToVerify) {
        // Check if the slot has admin availability
        if (slot.availabilities.length === 0) {
          unavailableSlots.push({
            timeSlotId: slot.id,
            reason: 'No admin availability'
          });
        }

        // Check if the slot is already booked
        if (slot.appointment) {
          unavailableSlots.push({
            timeSlotId: slot.id,
            reason: 'Already booked by another patient'
          });
        }
      }

      // If there are unavailable slots, abort the transaction
      if (unavailableSlots.length > 0) {
        return {
          success: false,
          unavailableSlots,
          message: 'Some selected slots are not available for booking'
        };
      }

      // Step 5: Process cancellations
      const canceledAppointments = [];

      for (const appointmentId of appointmentsToCancel) {
        const appointment = await tx.appointment.delete({
          where: { id: appointmentId },
          include: { timeSlot: true }
        });

        canceledAppointments.push({
          appointmentId: appointment.id,
          timeSlotId: appointment.timeSlotId
        });
      }

      // Step 6: Process bookings
      const newAppointments = [];

      for (const timeSlotId of slotsToBook) {
        const appointment = await tx.appointment.create({
          data: {
            patientId,
            timeSlotId,
            status: 'CONFIRMED',
            bookedAt: new Date()
          },
          include: { timeSlot: true }
        });

        // Format the appointment for response
        const slot = appointment.timeSlot;
        const zonedDate = toZonedTime(slot.date, TIMEZONE);
        const zonedStartTime = toZonedTime(slot.startTime, TIMEZONE);

        newAppointments.push({
          appointmentId: appointment.id,
          timeSlotId: appointment.timeSlotId,
          date: format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE }),
          time: format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE })
        });
      }

      return {
        success: true,
        booked: newAppointments.length,
        canceled: canceledAppointments.length,
        kept: appointmentsToKeep.length,
        newAppointments,
        canceledAppointments,
        message: `Successfully updated appointments: ${newAppointments.length} booked, ${canceledAppointments.length} canceled, ${appointmentsToKeep.length} kept`
      };
    });

    // If there were unavailable slots, return a 409 Conflict status
    if (!result.success) {
      return res.status(409).json(result);
    }

    // Otherwise, return a 200 OK status with the result
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error updating patient appointments: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to update appointments',
      message: error.message
    });
  }
};
