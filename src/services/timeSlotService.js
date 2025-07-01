// src/services/timeSlotService.js
const { prisma } = require('../config');
const { formatISO, addHours, startOfDay, addDays, setHours } = require('date-fns');
const { utcToZonedTime, zonedTimeToUtc, format } = require('date-fns-tz');

// Timezone for Asia/Kolkata
const TIMEZONE = 'Asia/Kolkata';

/**
 * Convert a date to a timezone-specific ISO string
 * @param {Date} date - The date to convert
 * @returns {string} - ISO string with timezone information
 */
function toTimeZoneISOString(date) {
  const zonedDate = utcToZonedTime(date, TIMEZONE);
  return formatISO(zonedDate);
}

/**
 * Generate and get time slots for the next 5 days
 * @returns {Promise<Array>} - Array of time slots
 */
async function generateAndGetTimeSlots() {
  // Get current date in the specified timezone
  const now = new Date();
  const zonedDate = utcToZonedTime(now, TIMEZONE);
  const today = startOfDay(zonedDate);
  
  // Time slot settings
  const startHour = 8; // 8 AM
  const endHour = 21;  // 9 PM
  const slotDurationHours = 1;
  const daysToGenerate = 5;
  
  // Generate time slots for the next 5 days if they don't exist
  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const currentDate = addDays(today, dayOffset);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const slotDate = startOfDay(currentDate);
      const slotStartTime = setHours(currentDate, hour);
      const slotEndTime = addHours(slotStartTime, slotDurationHours);
      
      // Convert to UTC for storage
      const utcDate = zonedTimeToUtc(slotDate, TIMEZONE);
      const utcStartTime = zonedTimeToUtc(slotStartTime, TIMEZONE);
      const utcEndTime = zonedTimeToUtc(slotEndTime, TIMEZONE);
      
      // Check if the slot already exists
      const existingSlot = await prisma.timeSlot.findFirst({
        where: {
          date: utcDate,
          startTime: utcStartTime
        }
      });
      
      // Create the slot if it doesn't exist
      if (!existingSlot) {
        await prisma.timeSlot.create({
          data: {
            date: utcDate,
            startTime: utcStartTime,
            endTime: utcEndTime,
            isLocked: false
          }
        });
      }
    }
  }
  
  // Fetch all time slots for the next 5 days
  return await getTimeSlotsForNext5Days();
}

/**
 * Get time slots for the next 5 days
 * @returns {Promise<Array>} - Array of time slots with admin availability and appointment info
 */
async function getTimeSlotsForNext5Days() {
  // Get current date in the specified timezone
  const now = new Date();
  const zonedDate = utcToZonedTime(now, TIMEZONE);
  const today = startOfDay(zonedDate);
  const utcToday = zonedTimeToUtc(today, TIMEZONE);
  const fiveDaysLater = addDays(today, 5);
  const utcFiveDaysLater = zonedTimeToUtc(fiveDaysLater, TIMEZONE);
  
  // Fetch all time slots for the next 5 days with admin availability and appointments
  const timeSlots = await prisma.timeSlot.findMany({
    where: {
      date: {
        gte: utcToday,
        lt: utcFiveDaysLater
      }
    },
    include: {
      availabilities: {
        select: {
          id: true,
          adminId: true
        }
      },
      appointment: {
        select: {
          id: true,
          patientId: true,
          status: true,
          bookedAt: true
        }
      }
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' }
    ]
  });
  
  // Get admin details for the availability
  const adminIds = new Set();
  timeSlots.forEach(slot => {
    slot.availabilities.forEach(avail => {
      adminIds.add(avail.adminId);
    });
  });
  
  const admins = await prisma.user.findMany({
    where: {
      id: {
        in: Array.from(adminIds)
      },
      role: 'ADMIN'
    },
    select: {
      id: true,
      email: true
    }
  });
  
  const adminMap = {};
  admins.forEach(admin => {
    adminMap[admin.id] = admin;
  });
  
  // Get patient details for the appointments
  const patientIds = new Set();
  timeSlots.forEach(slot => {
    if (slot.appointment) {
      patientIds.add(slot.appointment.patientId);
    }
  });
  
  const patients = await prisma.user.findMany({
    where: {
      id: {
        in: Array.from(patientIds)
      },
      role: 'PATIENT'
    },
    select: {
      id: true,
      email: true
    }
  });
  
  const patientMap = {};
  patients.forEach(patient => {
    patientMap[patient.id] = patient;
  });
  
  // Format the time slots for response
  return timeSlots.map(slot => {
    const zonedStartTime = utcToZonedTime(slot.startTime, TIMEZONE);
    const zonedEndTime = utcToZonedTime(slot.endTime, TIMEZONE);
    
    return {
      slotId: slot.id,
      date: format(utcToZonedTime(slot.date, TIMEZONE), 'yyyy-MM-dd'),
      startTime: format(zonedStartTime, 'HH:mm'),
      endTime: format(zonedEndTime, 'HH:mm'),
      isLocked: slot.isLocked,
      formattedDate: format(utcToZonedTime(slot.date, TIMEZONE), 'EEEE, MMMM d, yyyy'),
      formattedTime: `${format(zonedStartTime, 'h:mm a')} - ${format(zonedEndTime, 'h:mm a')}`,
      startISOString: toTimeZoneISOString(slot.startTime),
      endISOString: toTimeZoneISOString(slot.endTime),
      adminsAvailable: slot.availabilities.map(avail => ({
        adminId: avail.adminId,
        email: adminMap[avail.adminId]?.email || 'Unknown'
      })),
      patientBooked: slot.appointment ? {
        patientId: slot.appointment.patientId,
        email: patientMap[slot.appointment.patientId]?.email || 'Unknown',
        status: slot.appointment.status,
        bookedAt: slot.appointment.bookedAt
      } : null
    };
  });
}

/**
 * Group time slots by date for UI rendering
 * @param {Array} timeSlots - Array of time slots
 * @returns {Object} - Object with dates as keys and arrays of time slots as values
 */
function groupTimeSlotsByDate(timeSlots) {
  const grouped = {};
  
  timeSlots.forEach(slot => {
    const dateKey = slot.date;
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(slot);
  });
  
  return grouped;
}

/**
 * Check if a slot is available for booking
 * @param {number} slotId - ID of the time slot
 * @returns {Promise<boolean>} - Whether the slot is available
 */
async function isSlotAvailableForBooking(slotId) {
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
    include: {
      availabilities: true,
      appointment: true
    }
  });
  
  if (!slot) {
    return false; // Slot doesn't exist
  }
  
  if (slot.isLocked || slot.appointment) {
    return false; // Slot is locked or already has an appointment
  }
  
  if (slot.availabilities.length === 0) {
    return false; // No admin availability
  }
  
  return true; // Slot is available for booking
}

/**
 * Check if a slot is available for admin to mark availability
 * @param {number} slotId - ID of the time slot
 * @param {number} adminId - ID of the admin 
 * @returns {Promise<boolean>} - Whether the slot is available
 */
async function isSlotAvailableForAdmin(slotId, adminId) {
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
    include: {
      availabilities: {
        where: { adminId }
      }
    }
  });
  
  if (!slot) {
    return false; // Slot doesn't exist
  }
  
  if (slot.isLocked) {
    return false; // Slot is locked
  }
  
  // Check if admin already marked availability for this slot
  if (slot.availabilities.length > 0) {
    return false; // Admin already marked availability
  }
  
  return true; // Slot is available for admin to mark availability
}

module.exports = {
  generateAndGetTimeSlots,
  getTimeSlotsForNext5Days,
  groupTimeSlotsByDate,
  isSlotAvailableForBooking,
  isSlotAvailableForAdmin,
  toTimeZoneISOString
};