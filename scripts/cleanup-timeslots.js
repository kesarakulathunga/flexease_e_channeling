// scripts/cleanup-timeslots.js
const { prisma } = require('../src/config');

/**
 * Delete a single time slot and all its related records
 */
async function deleteTimeSlot(timeSlotId) {
  console.log(`Attempting to delete time slot with ID ${timeSlotId}...`);
  
  try {
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete any admin availabilities for this slot
      const deletedAvailabilities = await tx.adminAvailability.deleteMany({
        where: { timeSlotId },
      });
      
      // 2. Delete any appointment for this slot
      const deletedAppointment = await tx.appointment.deleteMany({
        where: { timeSlotId },
      });
      
      // 3. Finally delete the time slot
      const deletedSlot = await tx.timeSlot.delete({
        where: { id: timeSlotId },
      });
      
      return {
        availabilities: deletedAvailabilities.count,
        appointments: deletedAppointment.count,
        slot: deletedSlot,
      };
    });
    
    console.log(`Successfully deleted time slot ID ${timeSlotId}`);
    console.log(`Cleaned up: ${result.availabilities} availabilities, ${result.appointments} appointments`);
    
    return true;
  } catch (error) {
    console.error(`Failed to delete time slot ID ${timeSlotId}:`, error.message);
    return false;
  }
}

/**
 * Delete multiple time slots by date range
 */
async function deleteTimeSlotsByDateRange(startDate, endDate) {
  console.log(`Deleting time slots from ${startDate} to ${endDate}...`);
  
  try {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date format. Use YYYY-MM-DD.');
      return;
    }
    
    // First get the IDs of all time slots in this range
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
      },
    });
    
    console.log(`Found ${timeSlots.length} time slots in the date range.`);
    
    // Delete each slot one by one
    let successCount = 0;
    for (const slot of timeSlots) {
      console.log(`Processing slot: ${slot.date.toISOString().split('T')[0]} at ${slot.startTime.toISOString().substr(11, 5)}`);
      const success = await deleteTimeSlot(slot.id);
      if (success) {
        successCount++;
      }
    }
    
    console.log(`Successfully deleted ${successCount} of ${timeSlots.length} time slots.`);
  } catch (error) {
    console.error('Error deleting time slots by date range:', error.message);
  }
}

/**
 * Delete all unused time slots (those without availabilities or appointments)
 */
async function deleteUnusedTimeSlots() {
  console.log('Deleting all unused time slots...');
  
  try {
    // Find all time slots that don't have availabilities or appointments
    const unusedSlots = await prisma.timeSlot.findMany({
      where: {
        AND: [
          {
            availabilities: {
              none: {},
            },
          },
          {
            appointment: null,
          },
        ],
      },
      select: {
        id: true,
        date: true,
        startTime: true,
      },
    });
    
    console.log(`Found ${unusedSlots.length} unused time slots.`);
    
    // Delete them in a single operation since they have no dependencies
    if (unusedSlots.length > 0) {
      const ids = unusedSlots.map((slot) => slot.id);
      const result = await prisma.timeSlot.deleteMany({
        where: {
          id: { in: ids },
        },
      });
      
      console.log(`Deleted ${result.count} unused time slots.`);
    }
  } catch (error) {
    console.error('Error deleting unused time slots:', error.message);
  }
}

/**
 * Delete all time slots regardless of their status
 * This will also delete all related adminAvailability and appointment records
 */
async function deleteAllTimeSlots() {
  console.log('Deleting ALL time slots from the database...');
  console.log('WARNING: This will delete all appointment and availability data!');
  console.log('Press Ctrl+C NOW if you want to cancel this operation.');
  
  // Give the user 5 seconds to cancel the operation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all admin availabilities
      const deletedAvailabilities = await tx.adminAvailability.deleteMany({});
      
      // 2. Delete all appointments
      const deletedAppointments = await tx.appointment.deleteMany({});
      
      // 3. Finally delete all time slots
      const deletedSlots = await tx.timeSlot.deleteMany({});
      
      return {
        availabilities: deletedAvailabilities.count,
        appointments: deletedAppointments.count,
        slots: deletedSlots.count
      };
    });
    
    console.log(`
Operation completed successfully:
- Deleted ${result.availabilities} admin availability records
- Deleted ${result.appointments} appointment records
- Deleted ${result.slots} time slot records
    `);
    
    return true;
  } catch (error) {
    console.error(`Failed to delete all time slots:`, error.message);
    return false;
  }
}

// Handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage:
  node cleanup-timeslots.js <command> [options]

Commands:
  delete <id>                Delete a single time slot by ID
  delete-range <start> <end> Delete time slots in a date range (format: YYYY-MM-DD)
  delete-unused              Delete all time slots that have no availabilities or appointments
  delete-all                 Delete ALL time slots (WARNING: deletes all appointment data too)
  
Examples:
  node cleanup-timeslots.js delete 123
  node cleanup-timeslots.js delete-range 2025-05-15 2025-05-18
  node cleanup-timeslots.js delete-unused
  node cleanup-timeslots.js delete-all
`);
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'delete':
      if (!args[1]) {
        console.error('Error: Time slot ID is required');
        return;
      }
      await deleteTimeSlot(parseInt(args[1], 10));
      break;
      
    case 'delete-range':
      if (!args[1] || !args[2]) {
        console.error('Error: Start and end dates are required');
        return;
      }
      await deleteTimeSlotsByDateRange(args[1], args[2]);
      break;
      
    case 'delete-unused':
      await deleteUnusedTimeSlots();
      break;
      
    case 'delete-all':
      await deleteAllTimeSlots();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use --help to see available commands');
  }
  
  await prisma.$disconnect();
}

// Run the script
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
