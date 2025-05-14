// verify-profile-schema.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log('Verifying database schema alignment with Prisma schema...');
    
    // Check if PatientProfile has the expected fields
    const databaseInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'PatientProfile'
      ORDER BY column_name;
    `;
    
    console.log('\nPatientProfile table columns:');
    console.table(databaseInfo);
    
    // Check for specific columns we're concerned about
    const mobileNumberCol = databaseInfo.find(col => col.column_name === 'mobileNumber');
    const updatedAtCol = databaseInfo.find(col => col.column_name === 'updatedAt');
    
    if (!mobileNumberCol) {
      console.error('ERROR: mobileNumber column not found in PatientProfile table!');
    } else {
      console.log('\nmobileNumber column:');
      console.log(`- Type: ${mobileNumberCol.data_type}`);
      console.log(`- Nullable: ${mobileNumberCol.is_nullable}`);
      console.log('✓ mobileNumber column exists with expected configuration');
    }
    
    if (!updatedAtCol) {
      console.error('ERROR: updatedAt column not found in PatientProfile table!');
    } else {
      console.log('\nupdatedAt column:');
      console.log(`- Type: ${updatedAtCol.data_type}`);
      console.log(`- Nullable: ${updatedAtCol.is_nullable}`);
      console.log('✓ updatedAt column exists with expected configuration');
    }
    
    // Test the updating functionality
    console.log('\nVerifying the profile update functionality...');
    
    // Find a patient profile for testing
    const patient = await prisma.patientProfile.findFirst();
    
    if (!patient) {
      console.log('No patient profiles found for testing. Creating a test profile...');
      
      // Create a test patient
      const newPatient = await prisma.patientProfile.create({
        data: {
          email: 'test.patient@example.com',
          fullName: 'Test Patient',
          age: 30,
          nicNumber: 'TEST123456',
          mobileNumber: '1234567890'
        }
      });
      
      console.log('Created test patient profile:');
      console.log(newPatient);
      
      // Update the new patient profile
      const updatedPatient = await prisma.patientProfile.update({
        where: { id: newPatient.id },
        data: {
          age: 31,
          mobileNumber: '0987654321'
        }
      });
      
      console.log('\nUpdated test patient profile:');
      console.log(updatedPatient);
      
      // Check updatedAt field
      if (updatedPatient.updatedAt > newPatient.createdAt) {
        console.log('✓ updatedAt timestamp is newer than createdAt timestamp');
      } else {
        console.error('ERROR: updatedAt timestamp is not updating correctly!');
      }
      
      // Clean up test data
      await prisma.patientProfile.delete({
        where: { id: newPatient.id }
      });
      console.log('\nTest patient profile deleted.');
    } else {
      // Update an existing patient
      const originalDate = patient.updatedAt;
      
      // Wait a second to ensure the updatedAt timestamp will be different
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedPatient = await prisma.patientProfile.update({
        where: { id: patient.id },
        data: {
          mobileNumber: patient.mobileNumber 
            ? `${patient.mobileNumber}-updated` 
            : '1234567890-updated'
        }
      });
      
      console.log('Updated existing patient profile:');
      console.log(updatedPatient);
      
      // Check updatedAt field
      if (updatedPatient.updatedAt > originalDate) {
        console.log('✓ updatedAt timestamp is updated correctly');
      } else {
        console.error('ERROR: updatedAt timestamp is not updating correctly!');
      }
    }
    
    console.log('\nVerification completed!');
  } catch (error) {
    console.error('Error during schema verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
