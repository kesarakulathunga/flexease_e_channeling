const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicatePatients() {
  console.log('Starting duplicate patient cleanup...');

  // Find all patients
  const allPatients = await prisma.patientProfile.findMany();
  console.log(`Found ${allPatients.length} total patients`);

  // Track emails and unique identifiers to detect duplicates
  const emailMap = {};
  const nicNumberMap = {};
  const duplicatesToDelete = [];

  // Identify duplicates
  for (const patient of allPatients) {
    const uniqueKey = `${patient.email}_${patient.fullName}`; // Composite key of email + name

    // Check for email + name duplicates
    if (emailMap[uniqueKey]) {
      // Keep the first one, mark the later ones for deletion
      console.log(`Found duplicate: ${patient.id} with email ${patient.email} and name ${patient.fullName}`);
      duplicatesToDelete.push(patient.id);
    } else {
      emailMap[uniqueKey] = patient.id;
    }

    // Check for NIC number duplicates
    if (nicNumberMap[patient.nicNumber]) {
      console.log(`Found duplicate NIC: ${patient.id} with NIC ${patient.nicNumber}`);
      duplicatesToDelete.push(patient.id);
    } else {
      nicNumberMap[patient.nicNumber] = patient.id;
    }
  }

  console.log(`Found ${duplicatesToDelete.length} duplicates to remove`);

  // Delete duplicates
  if (duplicatesToDelete.length > 0) {
    const deleteResult = await prisma.patientProfile.deleteMany({
      where: {
        id: {
          in: duplicatesToDelete
        }
      }
    });
    
    console.log(`Deleted ${deleteResult.count} duplicate patients`);
  } else {
    console.log('No duplicates found');
  }
}

fixDuplicatePatients()
  .catch(error => {
    console.error('Error fixing duplicates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Cleanup complete');
  });
