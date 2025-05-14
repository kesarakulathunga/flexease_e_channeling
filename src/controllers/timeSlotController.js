// src/controllers/timeSlotController.js
const { prisma } = require('../config');

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

// 2. Get available time slots for a specific day/admin
exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { date, adminId } = req.query;
    
    // Build query conditions
    const where = { isAvailable: true };
    
    if (date) {
      const queryDate = new Date(date);
      where.slotDate = {
        gte: getStartOfDay(queryDate),
        lte: getEndOfDay(queryDate)
      };
    }
    
    if (adminId) {
      where.adminId = Number(adminId);
    }
    
    // Get available slots
    const slots = await prisma.timeSlot.findMany({
      where,
      orderBy: [
        { slotDate: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    res.json(slots);
  } catch (err) { next(err); }
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