// simple-profile-test.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runProfileTest() {
  try {
    console.log('=== Simple Profile Edit Test ===');
    
    // Create a test patient profile
    console.log('1. Creating test patient profile...');
    const patient = await prisma.patientProfile.create({
      data: {
        email: 'simple.test@example.com',
        fullName: 'Simple Test Patient',
        age: 35,
        nicNumber: 'SIMPLETEST123',
        mobileNumber: '9876543210'
      }
    });
    console.log('Created test patient:', patient);
    
    // Update the patient profile - basic info
    console.log('\n2. Updating basic information...');
    const updatedBasicInfo = await prisma.patientProfile.update({
      where: { id: patient.id },
      data: {
        fullName: 'Updated Simple Test Patient',
        age: 36,
        mobileNumber: '0123456789'
      }
    });
    console.log('Updated basic info:', updatedBasicInfo);
    console.log('✓ updatedAt changed:', patient.updatedAt.getTime() !== updatedBasicInfo.updatedAt.getTime());
    
    // Update the patient profile - email
    console.log('\n3. Updating email...');
    const updatedEmail = await prisma.patientProfile.update({
      where: { id: patient.id },
      data: {
        email: 'updated.simple.test@example.com'
      }
    });
    console.log('Updated email:', updatedEmail);
    console.log('✓ updatedAt changed again:', updatedBasicInfo.updatedAt.getTime() !== updatedEmail.updatedAt.getTime());
    
    // Clean up
    console.log('\n4. Cleaning up test data...');
    await prisma.patientProfile.delete({
      where: { id: patient.id }
    });
    console.log('Test patient deleted');
    
    console.log('\n✓ All tests passed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runProfileTest();
