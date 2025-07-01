// src/controllers/timeSlotController.js
const { prisma } = require('../config');
const logger = require('../utils/logger');

// Helper function to get date for start of day
const getStartOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Helper function to get date for end of day
const getEndOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

// 1. Create new time slots for a specific day
exports.createTimeSlots = async (req, res, next) => {
  try {
    const { adminId, date, startTime, endTime, slotDuration } = req.body;
    
    // Validate required fields
    if (!adminId || !date || !startTime || !endTime || !slotDuration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Convert to date objects
    const slotDate = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Create time slots
    const slots = [];
    let currentTime = new Date(slotDate);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTimeDate = new Date(slotDate);
    endTimeDate.setHours(endHour, endMinute, 0, 0);
    
    // Generate slots based on duration
    while (currentTime < endTimeDate) {
      const slotEndTime = new Date(currentTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + slotDuration);
      
      if (slotEndTime <= endTimeDate) {
        slots.push({
          adminId,
          slotDate: slotDate,
          startTime: new Date(currentTime),
          endTime: slotEndTime,
          isAvailable: true
        });
      }
      
      // Move to next slot
      currentTime = new Date(slotEndTime);
    }
    
    // Bulk create time slots
    const createdSlots = await prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true
    });
    
    // Fetch the created slots to return them
    const resultSlots = await prisma.timeSlot.findMany({
      where: {
        adminId,
        slotDate: {
          gte: getStartOfDay(slotDate),
          lte: getEndOfDay(slotDate)
        }
      },
      orderBy: { startTime: 'asc' }
    });
    
    res.status(201).json(resultSlots);
  } catch (err) { next(err); }
};

// 2. Get available time slots with enhanced support for frontend table display
exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    // Get query parameters with defaults and type checking
    let days;
    try {
      days = req.query.days ? parseInt(req.query.days, 10) : 5;
      if (isNaN(days) || days < 1 || days > 60) { // Reasonable limits
        return res.status(400).json({ 
          error: 'Invalid days parameter',
          details: 'Days must be a positive number between 1 and 60',
          code: 'INVALID_DAYS_PARAMETER'
        });
      }
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid days parameter',
        details: 'Days must be a valid number',
        code: 'INVALID_DAYS_FORMAT'
      });
    }
    
    let adminId;
    try {
      adminId = req.query.adminId ? parseInt(req.query.adminId, 10) : undefined;
      if (req.query.adminId && isNaN(adminId)) {
        return res.status(400).json({ 
          error: 'Invalid adminId parameter',
          details: 'Admin ID must be a valid number',
          code: 'INVALID_ADMIN_ID_FORMAT'
        });
      }
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid adminId parameter',
        details: 'Admin ID must be a valid number',
        code: 'INVALID_ADMIN_ID_FORMAT'
      });
    }
    
    const format = req.query.format || 'table';
    if (!['table', 'flat'].includes(format)) {
      return res.status(400).json({ 
        error: 'Invalid format parameter',
        details: 'Format must be either "table" or "flat"',
        code: 'INVALID_FORMAT_PARAMETER'
      });
    }
    
    // Safely parse the date
    let startDate;
    try {
      startDate = req.query.date ? new Date(req.query.date) : new Date();
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: 'Please provide a valid date in YYYY-MM-DD format',
        code: 'INVALID_DATE_FORMAT'
      });
    }
      // Set to start of day
    startDate = getStartOfDay(startDate);
    
    // Calculate end date (start date + days)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1); // -1 because we count the start date
    endDate.setHours(23, 59, 59, 999);
    
    logger.info(`Fetching slots from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Query for ALL time slots in date range (both available and unavailable)
    // We need this to accurately represent the table view where unavailable slots are empty cells
    let allTimeSlots = [];
    try {
      const whereClause = {
        slotDate: {
          gte: startDate,
          lte: endDate
        }
      };
      
      if (adminId) {
        whereClause.adminId = adminId;
      }
      
      allTimeSlots = await prisma.timeSlot.findMany({
        where: whereClause,
        orderBy: [
          { slotDate: 'asc' },
          { startTime: 'asc' },
        ],
      });
      
      logger.info(`Found ${allTimeSlots.length} total slots in date range`);
    } catch (queryError) {
      logger.error('Error querying time slots:', queryError);
      return res.status(500).json({ 
        error: 'Failed to retrieve time slots',
        details: queryError.message || 'Database query error',
        code: 'DATABASE_QUERY_ERROR'
      });
    }
    
    // Check if we have any data
    if (!allTimeSlots || !Array.isArray(allTimeSlots)) {
      logger.warn('No time slots data returned from database');
      
      // Return empty structured response instead of error
      if (format === 'table') {
        return res.json({
          totalSlots: 0,
          availableSlots: 0,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dateRange: []
        });
      } else {
        return res.json({
          totalSlots: 0,
          availableSlots: 0,
          timeSlots: []
        });
      }
    }
    
    // Format the response based on preference
    if (format === 'table') {
      // First, identify all unique times across all days
      const allTimes = new Set();
      const dateColumns = {};
      
      // Create date columns and collect unique times
      for (let i = 0; i < parseInt(days, 10); i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        dateColumns[dateStr] = {
          date: dateStr,
          displayDate: `${new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' })}, ${new Date(dateStr).toLocaleDateString(undefined, { month: 'short' })} ${new Date(dateStr).getDate()}`,
          slots: {}
        };
      }
      
      // Process slots into the structure
      allTimeSlots.forEach(slot => {
        const dateStr = slot.slotDate.toISOString().split('T')[0];
        const timeKey = new Date(slot.slotTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).toUpperCase();
        
        allTimes.add(timeKey);
        
        if (dateColumns[dateStr]) {
          dateColumns[dateStr].slots[timeKey] = {
            id: slot.id,
            isAvailable: slot.isAvailable,
            adminId: slot.adminId
          };
        }
      });
      
      // Sort times
      const sortedTimes = Array.from(allTimes).sort((a, b) => {
        const timeA = new Date(`01/01/2000 ${a}`);
        const timeB = new Date(`01/01/2000 ${b}`);
        return timeA - timeB;
      });
      
      // Convert to array of dates for the response
      const dateColumnsArray = Object.values(dateColumns);
      
      // Prepare the table format response
      res.json({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days, 10),
        timeSlots: sortedTimes,
        dates: dateColumnsArray,
        format: 'table'
      });
    } else if (format === 'grouped') {
      // Filter for only available slots for the grouped format
      const availableSlots = allTimeSlots.filter(slot => slot.isAvailable);
      
      // Group by date for easier frontend consumption
      const groupedSlots = {};
      
      availableSlots.forEach(slot => {
        const dateStr = slot.slotDate.toISOString().split('T')[0];
        
        if (!groupedSlots[dateStr]) {
          groupedSlots[dateStr] = [];
        }
        
        groupedSlots[dateStr].push({
          id: slot.id,
          adminId: slot.adminId,
          time: slot.slotTime.toISOString(),
          formattedTime: new Date(slot.slotTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isAvailable: slot.isAvailable
        });
      });
      
      // Add date metadata for the frontend
      const dateRange = [];
      for (let i = 0; i < parseInt(days, 10); i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        dateRange.push({
          date: dateStr,
          dayName: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' }),
          dayOfMonth: new Date(dateStr).getDate(),
          month: new Date(dateStr).toLocaleDateString(undefined, { month: 'short' }),
          hasSlots: !!groupedSlots[dateStr],
          slots: groupedSlots[dateStr] || []
        });
      }
      
      res.json({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days, 10),
        dateRange: dateRange,
        totalSlots: availableSlots.length,
        format: 'grouped'
      });
    } else {
      // Filter for only available slots for the flat format
      const availableSlots = allTimeSlots.filter(slot => slot.isAvailable);
      
      // Return flat list
      res.json({
        timeSlots: availableSlots.map(slot => ({
          id: slot.id,
          adminId: slot.adminId,
          date: slot.slotDate.toISOString(),
          time: slot.slotTime.toISOString(),
          formattedTime: new Date(slot.slotTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isAvailable: slot.isAvailable
        })),
        format: 'flat'
      });
    }
  } catch (err) { 
    logger.error(`Error fetching available time slots`, {
      error: err.message,
      stack: err.stack
    });
    next(err); 
  }
};

// 3. Get a specific time slot
exports.getTimeSlotById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    const slot = await prisma.timeSlot.findUnique({
      where: { id }
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    res.json(slot);
  } catch (err) { next(err); }
};

// 4. Update a time slot
exports.updateTimeSlot = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { isAvailable } = req.body;
    
    // Check if the time slot exists
    const slot = await prisma.timeSlot.findUnique({
      where: { id }
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Update the time slot
    const updatedSlot = await prisma.timeSlot.update({
      where: { id },
      data: { isAvailable }
    });
    
    res.json(updatedSlot);
  } catch (err) { next(err); }
};

// 5. Delete a time slot
exports.deleteTimeSlot = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    // Check if the time slot exists
    const slot = await prisma.timeSlot.findUnique({
      where: { id }
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Check if the slot is booked
    const appointment = await prisma.appointment.findFirst({
      where: { timeSlotId: id }
    });
    
    if (appointment) {
      return res.status(400).json({ 
        error: 'Cannot delete a time slot that has an appointment' 
      });
    }
    
    // Delete the time slot
    await prisma.timeSlot.delete({
      where: { id }
    });
    
    res.json({ message: 'Time slot deleted successfully' });
  } catch (err) { next(err); }
};