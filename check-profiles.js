// check-profiles.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    console.log('Checking for existing patient profiles...');
    
    const profiles = await prisma.patientProfile.findMany({
      take: 10
    });
    
    console.log(`Found ${profiles.length} patient profiles.`);
    
    if (profiles.length > 0) {
      console.log('\nSample profile:');
      console.log(profiles[0]);
    } else {
      console.log('\nNo patient profiles found in the database!');
      console.log('This could be why the frontend is failing to load profile data.');
    }
    
    // Check User table as well
    const users = await prisma.user.findMany({
      take: 10
    });
    
    console.log(`\nFound ${users.length} user accounts.`);
    
    if (users.length > 0) {
      console.log('\nSample user:');
      console.log(users[0]);
    } else {
      console.log('\nNo user accounts found in the database!');
    }
    
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles();
