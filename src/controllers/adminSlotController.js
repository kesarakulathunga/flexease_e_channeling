// src/controllers/adminSlotController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');
const { toZonedTime, format } = require('date-fns-tz');
const { startOfMonth, endOfMonth } = require('date-fns');

// Define the timezone for IST (Indian Standard Time)
const TIMEZONE = 'Asia/Kolkata'; // UTC+5:30

/**
 * Get all time slots marked by ALL admins (unified view)
 * Returns a list of date-time combinations with booking status from all admins
 */
exports.getAdminMarkedSlots = async (req, res, next) => {
  try {
    // Get admin ID from JWT token
    const adminId = Number(req.user.userId);

    if (isNaN(adminId)) {
      logger.warn('Invalid admin ID in request');
      return res.status(400).json({
        success: false,
        error: 'Invalid admin ID'
      });
    }

    // Get date parameters from query string, if provided
    const { startDate, endDate } = req.query;

    // Default to current date if startDate is not provided
    let startDateObj;
    if (startDate) {
      // Create date in IST timezone
      startDateObj = new Date(`${startDate}T00:00:00+05:30`);
    } else {
      // Use current date in IST timezone
      const now = new Date();
      startDateObj = new Date(now);
      startDateObj.setHours(0, 0, 0, 0);
    }

    // Default to startDate + 7 days if endDate is not provided
    let endDateObj;
    if (endDate) {
      // Create date in IST timezone
      endDateObj = new Date(`${endDate}T23:59:59+05:30`);
    } else {
      // Use startDate + 7 days in IST timezone
      endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 7);
      endDateObj.setHours(23, 59, 59, 999);
    }

    // Validate dates
    if (startDate && isNaN(startDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD'
      });
    }

    if (endDate && isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid endDate format. Use YYYY-MM-DD'
      });
    }

    logger.info(`Fetching marked slots for ALL admins from ${startDateObj.toISOString()} to ${endDateObj.toISOString()}`);

    // Fetch ALL time slots that ANY admin has marked as available (unified view)
    const adminAvailabilities = await prisma.adminAvailability.findMany({
      where: {
        // ✅ REMOVED adminId filter - now shows ALL admins' data
        timeSlot: {
          date: {
            gte: startDateObj,
            lte: endDateObj
          }
        }
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true
          }
        },
        timeSlot: {
          include: {
            appointment: true
          }
        }
      },
      orderBy: [
        {
          timeSlot: {
            date: 'asc'
          }
        },
        {
          timeSlot: {
            startTime: 'asc'
          }
        }
      ]
    });

    // Transform to a simple format for the frontend
    const markedSlots = adminAvailabilities.map(avail => {
      const slot = avail.timeSlot;

      // Convert dates to IST timezone
      const zonedDate = toZonedTime(slot.date, TIMEZONE);
      const zonedStartTime = toZonedTime(slot.startTime, TIMEZONE);

      // Format date as YYYY-MM-DD in IST timezone
      const date = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });

      // Format time as HH:MM (24-hour format) in IST timezone
      const time = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

      // Check if this slot has an appointment
      const isBooked = !!slot.appointment;

      return {
        date,
        time,
        timeSlotId: slot.id,
        isBooked,
        appointmentId: isBooked ? slot.appointment.id : null,
        // ✅ Added admin info since we're showing all admins' data
        adminId: avail.adminId,
        adminEmail: avail.admin.email
      };
    });

    return res.status(200).json({
      success: true,
      markedSlots,
      totalSlots: markedSlots.length,
      dateRange: {
        startDate: startDate || startDateObj.toISOString().split('T')[0],
        endDate: endDate || endDateObj.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    logger.error(`Error fetching admin marked slots: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch marked slots',
      message: error.message
    });
  }
};

/**
 * Update admin's availability based on selected slots
 * Compares new selections with existing marked slots and updates accordingly
 */
exports.updateAdminAvailability = async (req, res, next) => {
  try {
    const { selectedSlots } = req.body;
    const adminId = Number(req.user.userId);

    if (isNaN(adminId)) {
      logger.warn('Invalid admin ID in request');
      return res.status(400).json({
        success: false,
        error: 'Invalid admin ID'
      });
    }

    // If selectedSlots is null or not an array, initialize it as an empty array
    if (!selectedSlots || !Array.isArray(selectedSlots)) {
      selectedSlots = [];
    }

    // Log the number of selected slots
    logger.info(`Admin ${adminId} updating availability with ${selectedSlots.length} selected slots`);

    // If there are no selected slots, it means the admin wants to clear all availability
    // We'll handle this as a special case

    // Validate each slot has required data (skip if there are no slots)
    const invalidSlots = [];

    if (selectedSlots.length > 0) {
      selectedSlots.forEach((slot, index) => {
        if (!slot.date || !slot.time) {
          invalidSlots.push({ index, slot, reason: 'Missing date or time' });
        } else {
          // Validate date format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) {
            invalidSlots.push({ index, slot, reason: 'Invalid date format, expected YYYY-MM-DD' });
          }
        }
      });

      if (invalidSlots.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Some slots have invalid data',
          invalidSlots
        });
      }
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Get all currently marked slots for this admin
      const currentAvailabilities = await tx.adminAvailability.findMany({
        where: { adminId },
        include: {
          timeSlot: {
            include: {
              appointment: true
            }
          }
        }
      });

      // Create a map of current slots for easy lookup
      const currentSlotMap = new Map();
      currentAvailabilities.forEach(avail => {
        // Convert dates to IST timezone
        const zonedDate = toZonedTime(avail.timeSlot.date, TIMEZONE);
        const zonedStartTime = toZonedTime(avail.timeSlot.startTime, TIMEZONE);

        // Format date and time in IST timezone
        const date = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
        const time = format(zonedStartTime, 'HH:mm', { timeZone: TIMEZONE });

        const key = `${date}|${time}`;
        currentSlotMap.set(key, {
          availabilityId: avail.id,
          timeSlotId: avail.timeSlotId,
          isBooked: !!avail.timeSlot.appointment
        });
      });

      // Step 2: Create a map of selected slots for easy lookup
      const selectedSlotMap = new Map();
      selectedSlots.forEach(slot => {
        const key = `${slot.date}|${slot.time}`;
        selectedSlotMap.set(key, slot);
      });

      // Step 3: Determine which slots to add and which to remove
      const slotsToAdd = [];
      const slotsToRemove = [];
      const conflicts = [];

      // Find slots to remove (in current but not in selected)
      for (const [key, value] of currentSlotMap.entries()) {
        if (!selectedSlotMap.has(key)) {
          // Check if this slot has a booking
          if (value.isBooked) {
            const [date, time] = key.split('|');
            conflicts.push({ date, time, timeSlotId: value.timeSlotId });
          } else {
            slotsToRemove.push(value.availabilityId);
          }
        }
      }

      // Find slots to add (in selected but not in current)
      for (const [key, slot] of selectedSlotMap.entries()) {
        if (!currentSlotMap.has(key)) {
          slotsToAdd.push(slot);
        }
      }

      // If there are conflicts, abort the transaction
      if (conflicts.length > 0) {
        return {
          success: false,
          conflicts,
          message: 'Cannot remove slots that are already booked'
        };
      }

      // Step 4: Process removals
      if (slotsToRemove.length > 0) {
        await tx.adminAvailability.deleteMany({
          where: {
            id: { in: slotsToRemove }
          }
        });
      }

      // Step 5: Process additions
      const addedSlots = [];

      for (const slot of slotsToAdd) {
        try {
          // Parse the date and time in IST timezone
          let dateTimeString;

          // Handle different time formats
          if (slot.time.includes(':')) {
            if (slot.time.includes('AM') || slot.time.includes('PM')) {
              // 12-hour format (e.g., "9:30 AM")
              dateTimeString = `${slot.date}T${slot.time}+05:30`;
            } else {
              // 24-hour format (e.g., "09:30")
              dateTimeString = `${slot.date}T${slot.time}:00+05:30`;
            }
          } else {
            // Just hours (e.g., "9") - add ":00"
            dateTimeString = `${slot.date}T${slot.time}:00:00+05:30`;
          }

          // Create date object in IST timezone
          const dateTime = new Date(dateTimeString);

          if (isNaN(dateTime.getTime())) {
            throw new Error(`Invalid date/time: ${dateTimeString}`);
          }

          // Create date at midnight
          const slotDate = new Date(dateTime);
          slotDate.setHours(0, 0, 0, 0);

          // Create end time (1 hour later)
          const endTime = new Date(dateTime);
          endTime.setHours(endTime.getHours() + 1);

          // Find or create the time slot
          let timeSlot = await tx.timeSlot.findFirst({
            where: {
              date: {
                equals: slotDate
              },
              startTime: {
                equals: dateTime
              }
            }
          });

          if (!timeSlot) {
            timeSlot = await tx.timeSlot.create({
              data: {
                date: slotDate,
                startTime: dateTime,
                endTime: endTime,
                isLocked: false
              }
            });
          }

          // Create the admin availability
          await tx.adminAvailability.create({
            data: {
              adminId,
              timeSlotId: timeSlot.id
            }
          });

          addedSlots.push({
            date: slot.date,
            time: slot.time,
            timeSlotId: timeSlot.id
          });
        } catch (error) {
          logger.error(`Error processing slot: ${JSON.stringify(slot)}`, {
            error: error.message
          });
          // Continue with other slots
        }
      }

      return {
        success: true,
        added: addedSlots.length,
        removed: slotsToRemove.length,
        addedSlots,
        message: `Successfully updated availability: ${addedSlots.length} slots added, ${slotsToRemove.length} slots removed`
      };
    });

    // If there were conflicts, return a 409 Conflict status
    if (!result.success) {
      return res.status(409).json(result);
    }

    // Otherwise, return a 200 OK status with the result
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error updating admin availability: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to update admin availability',
      message: error.message
    });
  }
};

/**
 * Get count of availability slots for each admin for the current month
 * This endpoint allows admins to see how many slots each admin has marked as available
 */
exports.getAdminAvailabilityCount = async (req, res, next) => {
  try {
    // Verify admin role
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin) {
      logger.warn(`Unauthorized attempt to access admin availability count by user: ${req.user?.email || 'unknown'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can access this endpoint'
      });
    }

    // Calculate current month's start and end dates in IST timezone
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create date objects for the first and last day of the current month
    const startDate = startOfMonth(new Date(currentYear, currentMonth));
    const endDate = endOfMonth(new Date(currentYear, currentMonth));

    // Convert to IST timezone for display
    const zonedStartDate = toZonedTime(startDate, TIMEZONE);
    const zonedEndDate = toZonedTime(endDate, TIMEZONE);

    // Format dates for display
    const formattedStartDate = format(zonedStartDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
    const formattedEndDate = format(zonedEndDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
    const monthName = format(zonedStartDate, 'MMMM yyyy', { timeZone: TIMEZONE });

    logger.info(`Fetching admin availability counts for ${monthName} (${formattedStartDate} to ${formattedEndDate})`);

    // Get all admin availabilities for the current month
    const adminAvailabilities = await prisma.adminAvailability.findMany({
      where: {
        timeSlot: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true
          }
        },
        timeSlot: {
          select: {
            date: true,
            startTime: true,
            appointment: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Group availabilities by admin and count
    const adminCounts = {};

    adminAvailabilities.forEach(avail => {
      const adminId = avail.adminId;
      const isBooked = !!avail.timeSlot.appointment;

      if (!adminCounts[adminId]) {
        adminCounts[adminId] = {
          adminId,
          email: avail.admin.email,
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0
        };
      }

      adminCounts[adminId].totalSlots++;

      if (isBooked) {
        adminCounts[adminId].bookedSlots++;
      } else {
        adminCounts[adminId].availableSlots++;
      }
    });

    // Convert to array and sort by total slots (descending)
    const adminCountsArray = Object.values(adminCounts).sort((a, b) => b.totalSlots - a.totalSlots);

    // Get admin profile information to include names
    const adminIds = adminCountsArray.map(admin => admin.adminId);
    const adminProfiles = await prisma.adminProfile.findMany({
      where: {
        email: {
          in: adminCountsArray.map(admin => admin.email)
        }
      },
      select: {
        email: true,
        fullName: true
      }
    });

    // Create a map for quick profile lookups
    const profileMap = {};
    adminProfiles.forEach(profile => {
      profileMap[profile.email] = profile;
    });

    // Enhance admin counts with profile information
    const enhancedAdminCounts = adminCountsArray.map(admin => {
      const profile = profileMap[admin.email] || {};
      return {
        ...admin,
        name: profile.fullName || 'Unknown'
      };
    });

    // Calculate total counts across all admins
    const totalCounts = {
      totalSlots: enhancedAdminCounts.reduce((sum, admin) => sum + admin.totalSlots, 0),
      bookedSlots: enhancedAdminCounts.reduce((sum, admin) => sum + admin.bookedSlots, 0),
      availableSlots: enhancedAdminCounts.reduce((sum, admin) => sum + admin.availableSlots, 0)
    };

    logger.info(`Found ${enhancedAdminCounts.length} admins with ${totalCounts.totalSlots} total slots for ${monthName}`);

    return res.status(200).json({
      success: true,
      month: {
        name: monthName,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      },
      admins: enhancedAdminCounts,
      totalCounts
    });
  } catch (error) {
    logger.error(`Error fetching admin availability counts: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin availability counts',
      message: error.message
    });
  }
};