// src/controllers/adminTimeSlotController-fixed.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

/**
 * Update admin's availability for time slots
 */
exports.updateAvailability = async (req, res, next) => {
  try {
    const { slotIds, available } = req.body;
    const adminId = Number(req.user.userId);
    
    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({ error: 'Must provide an array of slot IDs' });
    }
    
    const numericSlotIds = slotIds.map(id => Number(id));
    
    // Find slots to check if they exist and aren't locked
    const slots = await prisma.timeSlot.findMany({
      where: {
        id: { in: numericSlotIds }
      },
      include: {
        appointment: true
      }
    });
    
    // Check for non-existent slots
    if (slots.length !== numericSlotIds.length) {
      const foundIds = slots.map(s => s.id);
      const missingIds = numericSlotIds.filter(id => !foundIds.includes(id));
      
      return res.status(404).json({
        error: 'Some slots do not exist',
        missingSlotIds: missingIds
      });
    }
    
    // Check for locked slots if making available
    if (available) {
      const lockedSlots = slots.filter(slot => slot.isLocked);
      if (lockedSlots.length > 0) {
        return res.status(409).json({
          error: 'Cannot mark locked slots as available',
          lockedSlotIds: lockedSlots.map(s => s.id)
        });
      }
    }
    
    let updatedCount = 0;
    
    // Update the admin availability records
    await prisma.$transaction(async (prismaClient) => {
      if (available) {
        // For marking slots as available, create AdminAvailability records
        const availabilityData = numericSlotIds.map(slotId => ({
          adminId,
          timeSlotId: slotId
        }));
        
        const result = await prismaClient.adminAvailability.createMany({
          data: availabilityData,
          skipDuplicates: true
        });
        
        updatedCount = result.count;
      } else {
        // For marking slots as unavailable, delete AdminAvailability records
        const result = await prismaClient.adminAvailability.deleteMany({
          where: {
            adminId,
            timeSlotId: { in: numericSlotIds }
          }
        });
        
        updatedCount = result.count;
      }
    });
    
    res.json({
      success: true,
      message: `Successfully ${available ? 'added' : 'removed'} availability for ${updatedCount} time slots`,
      updatedCount
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get admin's time slots
 */
exports.getAdminTimeSlots = async (req, res, next) => {
  try {
    const adminId = parseInt(req.user.userId);
    
    // Calculate date range (today + 30 days by default)
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    
    // Get time slots with admin availability
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        availabilities: {
          some: {
            adminId
          }
        },
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        availabilities: true,
        appointment: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });
    
    // Group slots by date
    const slotsByDate = {};
    timeSlots.forEach(slot => {
      const dateStr = slot.date.toISOString().split('T')[0];
      
      if (!slotsByDate[dateStr]) {
        const displayDate = slot.date.toLocaleDateString('en-US', { 
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
      
      // Check if slot has admin availability
      const hasAdminAvailability = slot.availabilities.some(avail => avail.adminId === adminId);
      
      // Format times for display
      const formattedStartTime = slot.startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      
      const formattedEndTime = slot.endTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      
      // Add slot to the date group
      slotsByDate[dateStr].slots.push({
        slotId: slot.id,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        timeRange: `${formattedStartTime} - ${formattedEndTime}`,
        isAvailable: hasAdminAvailability && !slot.isLocked,
        isBooked: slot.appointment !== null
      });
    });
    
    // Convert to array for response
    const dates = Object.values(slotsByDate).sort((a, b) => a.date.localeCompare(b.date));
    
    return res.status(200).json({
      success: true,
      dates,
      totalSlots: timeSlots.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug endpoint
 */
exports.getAdminTimeSlotsDebug = async (req, res, next) => {
  try {
    const adminId = Number(req.user.userId);
    const slots = await prisma.timeSlot.findMany({
      take: 10,
      orderBy: { id: 'desc' }
    });
    
    res.json({
      adminId,
      totalSlots: slots.length,
      slots: slots.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        isLocked: s.isLocked
      }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create time slots
 */
exports.updateTimeSlots = async (req, res) => {
  try {
    const adminId = parseInt(req.user.userId);
    const slots = req.body.slots;

    if (!Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: slots must be an array'
      });
    }

    // Format the slots with proper date/time handling
    const formattedSlots = [];
    
    for (const slot of slots) {
      try {
        if (!slot.date) {
          throw new Error('Missing required date field');
        }
        
        // Get the date part
        const dateObj = new Date(slot.date);
        dateObj.setHours(0, 0, 0, 0);
        
        // Get the time part
        let startHour = 9, startMinute = 0; // Default to 9 AM
        
        if (slot.time) {
          if (typeof slot.time === 'string') {
            if (slot.time.includes(':')) {
              // Handle time formats like "14:00" or "2:00 PM"
              if (slot.time.includes(' ')) {
                // 12-hour format (e.g. "9:00 AM")
                const [timePart, period] = slot.time.split(' ');
                const [hours, minutes] = timePart.split(':');
                startHour = parseInt(hours);
                startMinute = parseInt(minutes);
                
                // Convert to 24-hour
                if (period.toUpperCase() === 'PM' && startHour !== 12) {
                  startHour += 12;
                } else if (period.toUpperCase() === 'AM' && startHour === 12) {
                  startHour = 0;
                }
              } else {
                // 24-hour format (e.g. "14:00")
                const [hours, minutes] = slot.time.split(':');
                startHour = parseInt(hours);
                startMinute = parseInt(minutes);
              }
            }
          }
        }
        
        // Create the start and end times
        const startTimeObj = new Date(dateObj);
        startTimeObj.setHours(startHour, startMinute, 0, 0);
        
        const endTimeObj = new Date(startTimeObj);
        endTimeObj.setHours(startTimeObj.getHours() + 1, 0, 0, 0); // Default 1-hour slot
        
        formattedSlots.push({
          date: dateObj,
          startTime: startTimeObj,
          endTime: endTimeObj,
          isLocked: false
        });
      } catch (error) {
        console.error(`Error formatting slot:`, error);
      }
    }

    if (formattedSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid slots could be created from the input'
      });
    }

    // Create the slots in the database
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const slot of formattedSlots) {
      try {
        // Check if this slot already exists
        const existingSlot = await prisma.timeSlot.findFirst({
          where: {
            date: { equals: slot.date },
            startTime: { equals: slot.startTime }
          }
        });
        
        if (existingSlot) {
          // Update existing slot
          await prisma.timeSlot.update({
            where: { id: existingSlot.id },
            data: { isLocked: slot.isLocked }
          });
          updatedCount++;
        } else {
          // Create new slot
          await prisma.timeSlot.create({
            data: slot
          });
          createdCount++;
        }
      } catch (error) {
        console.error('Error processing slot:', error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Time slots updated successfully',
      data: {
        createdCount,
        updatedCount,
        totalProcessed: createdCount + updatedCount
      }
    });
  } catch (error) {
    console.error('Error in updateTimeSlots:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update time slots',
      error: error.message
    });
  }
};

/**
 * Create bulk time slots
 */
exports.createBulkTimeSlots = async (req, res, next) => {
  try {
    const adminId = Number(req.user.userId);
    const { startDate, endDate, timeRanges, daysOfWeek } = req.body;
    
    if (!startDate || !endDate || !timeRanges || !daysOfWeek) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Parse date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate time slots
    const slots = [];
    const currentDate = new Date(start);
    
    // Loop through days
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      
      if (daysOfWeek.includes(dayOfWeek)) {
        // Loop through time ranges
        for (const range of timeRanges) {
          const [startHour, startMinute] = range.startTime.split(':').map(Number);
          const [endHour, endMinute] = range.endTime.split(':').map(Number);
          const intervalMinutes = Number(range.intervalMinutes || 60);
          
          // Create slot start time
          let slotStart = new Date(currentDate);
          slotStart.setHours(startHour, startMinute, 0, 0);
          
          // Create range end time
          const rangeEnd = new Date(currentDate);
          rangeEnd.setHours(endHour, endMinute, 0, 0);
          
          // Generate slots at intervals
          while (slotStart < rangeEnd) {
            // Create date with time set to midnight
            const dateOnly = new Date(currentDate);
            dateOnly.setHours(0, 0, 0, 0);
            
            // Calculate end time
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + intervalMinutes);
            
            slots.push({
              date: dateOnly,
              startTime: new Date(slotStart),
              endTime: new Date(slotEnd),
              isLocked: false
            });
            
            // Move to next interval
            slotStart = new Date(slotEnd);
          }
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create slots in database
    const result = await prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true
    });
    
    res.status(201).json({
      success: true,
      message: `Successfully created ${result.count} time slots`,
      createdCount: result.count,
      totalAttempted: slots.length
    });
  } catch (err) {
    next(err);
  }
};
