// test-edit-profile.js
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Configuration
const API_URL = 'http://localhost:4000/api';
const PATIENT_EMAIL = 'ex@g.c';

async function testEditProfile() {
  try {
    console.log('=== Testing Edit Profile Functionality ===\n');
    
    // Step 1: Find the existing patient
    console.log('1. Finding existing patient profile...');
    const patient = await prisma.patientProfile.findFirst({
      where: { email: PATIENT_EMAIL }
    });
    
    if (!patient) {
      console.error('No patient found with email:', PATIENT_EMAIL);
      return;
    }
    
    console.log('Found patient:', patient);
    const patientId = patient.id;
    
    // Step 2: Get auth token by logging in (need OTP from server logs)
    console.log('\n2. To test editing through the API, you need to:');
    console.log('   a. Login and get a valid JWT token');
    console.log('   b. Use that token to make an update request');
    console.log('\n   Example endpoint: PUT /api/profile/patient/' + patientId);
    console.log('   Example request body:');
    console.log('   {');
    console.log('     "fullName": "Updated Name",');
    console.log('     "age": 56,');
    console.log('     "nicNumber": "' + patient.nicNumber + '",');
    console.log('     "mobileNumber": "0771234567"');
    console.log('   }');
    
    // Step 3: Alternative test - direct database update
    console.log('\n3. Testing direct database update...');
    
    // Create update data that's different from current values
    const updateData = {
      fullName: patient.fullName + ' (Updated)',
      age: patient.age + 1,
      nicNumber: patient.nicNumber,
      mobileNumber: patient.mobileNumber || '0771234567' // Use existing or set new if null
    };
    
    console.log('Update data:', updateData);
    
    // Perform update
    try {
      const updatedPatient = await prisma.patientProfile.update({
        where: { id: patientId },
        data: updateData
      });
      
      console.log('\nUpdate successful. Updated patient:');
      console.log(updatedPatient);
      
      // Verify updatedAt timestamp changed
      if (updatedPatient.updatedAt > patient.updatedAt) {
        console.log('\n✓ updatedAt timestamp updated correctly');
      } else {
        console.log('\n✗ updatedAt timestamp did not update properly');
      }
      
      // Restore original values
      console.log('\nRestoring original values...');
      const restored = await prisma.patientProfile.update({
        where: { id: patientId },
        data: {
          fullName: patient.fullName,
          age: patient.age,
          nicNumber: patient.nicNumber,
          mobileNumber: patient.mobileNumber
        }
      });
      
      console.log('Original values restored:', restored);
      
    } catch (dbError) {
      console.error('Database update error:', dbError.message);
    }
    
    // Step 4: Create a manual curl command for testing API
    console.log('\n4. For API testing, you can use this curl command:');
    console.log(`curl -X PUT "${API_URL}/profile/patient/${patientId}" \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
    console.log(`  -d '{"fullName": "${patient.fullName}", "age": ${patient.age}, "nicNumber": "${patient.nicNumber}", "mobileNumber": "0771234567"}'`);
  } catch (error) {
    console.error('Error in test script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEditProfile();
