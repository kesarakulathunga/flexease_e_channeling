// src/controllers/patientSlotController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const { toZonedTime, format } = require('date-fns-tz');

// Define the timezone for IST (Indian Standard Time)
const TIMEZONE = 'Asia/Kolkata'; // UTC+5:30

/**
 * Get available time slots for patients to book appointments
 * Returns available time slots that have admin availability and are not booked
 */
exports.getAvailableSlotsForPatients = async (req, res, next) => {
  try {
    // Get query parameters
    const { startDate: startDateParam, endDate: endDateParam } = req.query;

    // Default to current date and next 4 days (5 days total)
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

    logger.info(`Fetching available slots from ${startDateObj.toISOString()} to ${endDateObj.toISOString()}`);

    // Get the patient ID if the user is logged in
    const patientId = req.user?.userId;

    // Fetch all time slots that have admin availability and no appointment
    const availableTimeSlots = await prisma.timeSlot.findMany({
      where: {
        date: {
          gte: startDateObj,
          lte: endDateObj
        },
        // Has at least one admin availability
        availabilities: {
          some: {}
        },
        // Has no appointment
        appointment: null
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
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    logger.info(`Found ${availableTimeSlots.length} available slots for patients`);

    // Get admin info for all admins with available slots
    const adminIds = [...new Set(availableTimeSlots.flatMap(slot =>
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

    // Get the patient's existing appointments if logged in
    let patientAppointments = [];
    if (patientId) {
      patientAppointments = await prisma.appointment.findMany({
        where: {
          patientId,
          timeSlot: {
            date: {
              gte: startDateObj,
              lte: endDateObj
            }
          }
        },
        include: {
          timeSlot: true
        }
      });
    }

    // Create a map of dates and times for the grid
    const dateTimeGrid = {};

    // First, collect all unique dates and times
    const uniqueDates = new Set();
    const uniqueTimes = new Set();

    availableTimeSlots.forEach(slot => {
      const zonedDate = toZonedTime(slot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(slot.startTime, TIMEZONE);

      const dateStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
      const timeStr = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

      uniqueDates.add(dateStr);
      uniqueTimes.add(timeStr);
    });

    // Also include dates and times from patient appointments
    patientAppointments.forEach(appt => {
      const zonedDate = toZonedTime(appt.timeSlot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(appt.timeSlot.startTime, TIMEZONE);

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
          appointmentId: null,
          timeSlotId: null,
          adminCount: 0,
          admins: []
        };
      });
    });

    // Fill in available slots
    availableTimeSlots.forEach(slot => {
      const zonedDate = toZonedTime(slot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(slot.startTime, TIMEZONE);

      const dateStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
      const timeStr = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

      if (dateTimeGrid[dateStr] && dateTimeGrid[dateStr][timeStr]) {
        dateTimeGrid[dateStr][timeStr].available = true;
        dateTimeGrid[dateStr][timeStr].timeSlotId = slot.id;
        dateTimeGrid[dateStr][timeStr].adminCount = slot.availabilities.length;

        // Add admin info
        dateTimeGrid[dateStr][timeStr].admins = slot.availabilities.map(avail => {
          const adminEmail = avail.admin.email;
          const adminInfo = adminMap[adminEmail] || { fullName: 'Unknown', specialty: '' };

          return {
            adminId: avail.adminId,
            email: adminEmail,
            name: adminInfo.fullName || 'Unknown',
            specialty: adminInfo.specialty || ''
          };
        });
      }
    });

    // Fill in booked slots for the patient
    patientAppointments.forEach(appt => {
      const zonedDate = toZonedTime(appt.timeSlot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(appt.timeSlot.startTime, TIMEZONE);

      const dateStr = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
      const timeStr = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

      if (dateTimeGrid[dateStr] && dateTimeGrid[dateStr][timeStr]) {
        dateTimeGrid[dateStr][timeStr].booked = true;
        dateTimeGrid[dateStr][timeStr].appointmentId = appt.id;
        dateTimeGrid[dateStr][timeStr].status = appt.status;
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

    return res.status(200).json({
      success: true,
      data: {
        dates: formattedDates,
        times: formattedTimes,
        grid: dateTimeGrid,
        totalAvailableSlots: availableTimeSlots.length,
        totalAppointments: patientAppointments.length,
        dateRange: {
          startDate: format(startDateObj, 'yyyy-MM-dd', { timeZone: TIMEZONE }),
          endDate: format(endDateObj, 'yyyy-MM-dd', { timeZone: TIMEZONE })
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting available slots for patients: ${error.message}`, {
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to get available time slots',
      error: error.message
    });
  }
};

/**
 * Public endpoint to get available time slots without authentication
 * This can be used for public pages or patient registration
 */
exports.getPublicAvailableSlots = async (req, res, next) => {
  try {
    // This is the same as getAvailableSlotsForPatients but without user context
    const { adminId } = req.query;

    // Default to current date and next 4 days (5 days total)
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + 4); // 5 days total including today
    endDate.setHours(23, 59, 59, 999); // End of day

    console.log(`Fetching public available slots from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const whereClause = {
      isAvailable: true,
      slotDate: {
        gte: startDate,
        lte: endDate
      }
    };

    if (adminId) {
      try {
        const adminIdNum = parseInt(adminId, 10);
        if (!isNaN(adminIdNum)) {
          whereClause.adminId = adminIdNum;
        }
      } catch (err) {
        logger.warn(`Invalid adminId parameter: ${adminId}`);
      }
    }

    const availableSlots = await prisma.timeSlot.findMany({
      where: whereClause,
      orderBy: [
        { slotDate: 'asc' },
        { slotTime: 'asc' }
      ]
    });

    console.log(`Found ${availableSlots.length} available slots for public view`);

    // Get admin info for all admins with available slots
    const adminIds = [...new Set(availableSlots.map(slot => slot.adminId))];
    const admins = await prisma.adminProfile.findMany({
      where: {
        id: { in: adminIds }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        specialty: true
      }
    });

    const adminMap = {};
    admins.forEach(admin => {
      adminMap[admin.id] = admin;
    });

    // Group slots by date for easy display
    const slotsByDate = {};

    availableSlots.forEach(slot => {
      const dateStr = slot.slotDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!slotsByDate[dateStr]) {
        const displayDate = new Date(dateStr).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });

        slotsByDate[dateStr] = {
          date: dateStr,
          displayDate,
          slots: []
        };
      }

      const admin = adminMap[slot.adminId] || { fullName: 'Unknown', specialty: '' };
      const formattedTime = slot.slotTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      slotsByDate[dateStr].slots.push({
        id: slot.id,
        time: slot.slotTime.toISOString(),
        formattedTime,
        adminId: slot.adminId,
        adminName: admin.fullName || 'Unknown',
        specialty: admin.specialty || ''
      });
    });

    // Convert to array format for response
    const dates = Object.values(slotsByDate);

    return res.status(200).json({
      success: true,
      data: {
        totalDates: dates.length,
        totalSlots: availableSlots.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dates
      }
    });
  } catch (error) {
    logger.error(`Error getting public available slots: ${error.message}`, {
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to get available time slots',
      error: error.message
    });
  }
};
