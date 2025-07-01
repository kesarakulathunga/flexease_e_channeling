// scripts/cleanup-appointments.js
const { prisma } = require('../src/config');

/**
 * Delete all appointments in the database
 * This will remove all appointment records but keep admin data intact
 */
async function deleteAllAppointments() {
  console.log('Deleting all appointments from the database...');
  
  try {
    // Count appointments before deletion
    const beforeCount = await prisma.appointment.count();
    console.log(`Found ${beforeCount} appointments in the database.`);
    
    if (beforeCount === 0) {
      console.log('No appointments to delete.');
      return;
    }
    
    // Delete all appointments
    const result = await prisma.appointment.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} appointments.`);
    console.log('Admin records and time slots remain intact.');
    
    return result.count;
  } catch (error) {
    console.error('Error deleting appointments:', error.message);
    throw error;
  }
}

/**
 * Delete appointments by date range
 */
async function deleteAppointmentsByDateRange(startDate, endDate) {
  console.log(`Deleting appointments from ${startDate} to ${endDate}...`);
  
  try {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date format. Use YYYY-MM-DD.');
      return;
    }
    
    // Delete appointments within the date range
    const result = await prisma.appointment.deleteMany({
      where: {
        timeSlot: {
          date: {
            gte: start,
            lte: end
          }
        }
      }
    });
    
    console.log(`Successfully deleted ${result.count} appointments in the date range.`);
    return result.count;
  } catch (error) {
    console.error('Error deleting appointments by date range:', error.message);
    throw error;
  }
}

// Handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage:
  node cleanup-appointments.js <command> [options]

Commands:
  delete-all                 Delete all appointments in the database
  delete-range <start> <end> Delete appointments in a date range (format: YYYY-MM-DD)
  
Examples:
  node cleanup-appointments.js delete-all
  node cleanup-appointments.js delete-range 2025-05-15 2025-05-18
`);
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'delete-all':
      await deleteAllAppointments();
      break;
      
    case 'delete-range':
      if (!args[1] || !args[2]) {
        console.error('Error: Start and end dates are required');
        return;
      }
      await deleteAppointmentsByDateRange(args[1], args[2]);
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
