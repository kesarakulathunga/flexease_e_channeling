// test-profile-api-flow.js
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const API_URL = 'http://localhost:4000/api';
const USER_EMAIL = 'ex@g.c';

async function testProfileApiFlow() {
  try {
    console.log('=== Testing Full Profile API Flow ===');
    
    // Step 1: Find the existing patient in the database
    const patient = await prisma.patientProfile.findFirst({
      where: { email: USER_EMAIL }
    });
    
    if (!patient) {
      console.error('Error: No patient found with email:', USER_EMAIL);
      return;
    }
    
    console.log('Found patient in database:', patient);
    
    // Step 2: Login Flow - Initiate OTP
    console.log('\n1. Initiating OTP login:');
    const initResponse = await axios.post(`${API_URL}/auth/check-email`, {
      email: USER_EMAIL,
      purpose: 'view_profile'
    });
    
    console.log('OTP Initiation Response:', initResponse.data);
    
    // Check server logs for OTP
    console.log('\nIMPORTANT: Check server logs for the OTP code');
    console.log('Please enter the OTP from the server logs when prompted.');
    
    // For testing purposes, hardcode an OTP - IN REAL SCENARIO, GET THIS FROM SERVER LOGS
    // Looking at the authenticated example, let's use a placeholder
    const otp = '123456'; // THIS IS A PLACEHOLDER - replace with real OTP from server logs
    
    console.log(`\nUsing OTP: ${otp} (replace with actual OTP if needed)`);
    
    // Step 3: Verify OTP to get token
    console.log('\n2. Verifying OTP:');
    try {
      const verifyResponse = await axios.post(`${API_URL}/auth/verify-email`, {
        email: USER_EMAIL,
        code: otp,
        purpose: 'view_profile'
      });
      
      console.log('Verification Response:', verifyResponse.data);
      
      if (!verifyResponse.data.token) {
        console.error('No token received. Cannot proceed with profile API tests.');
        return;
      }
      
      const token = verifyResponse.data.token;
      console.log('Received token:', token.substring(0, 20) + '...');
      
      // Step 4: Get the patient profile using the token
      console.log('\n3. Getting patient profile:');
      try {
        const profileResponse = await axios.get(
          `${API_URL}/profile/patient/${patient.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('Profile retrieval successful:');
        console.log(profileResponse.data);
        
        // Step 5: Update the profile
        console.log('\n4. Updating patient profile:');
        const updateData = {
          fullName: patient.fullName,
          age: patient.age,
          nicNumber: patient.nicNumber,
          mobileNumber: '0771234567' // Adding a mobile number
        };
        
        try {
          const updateResponse = await axios.put(
            `${API_URL}/profile/patient/${patient.id}`,
            updateData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('Profile update successful:');
          console.log(updateResponse.data);
          
          // Verify the mobile number was updated
          if (updateResponse.data.mobileNumber === '0771234567') {
            console.log('\n✓ Profile update API working correctly');
          } else {
            console.log('\n✗ Profile update did not work as expected');
          }
          
          // Step 6: Reset to original values if needed
          if (updateResponse.data.mobileNumber !== patient.mobileNumber) {
            console.log('\n5. Resetting to original values:');
            const resetData = {
              fullName: patient.fullName,
              age: patient.age,
              nicNumber: patient.nicNumber,
              mobileNumber: patient.mobileNumber
            };
            
            const resetResponse = await axios.put(
              `${API_URL}/profile/patient/${patient.id}`,
              resetData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('Reset successful:');
            console.log(resetResponse.data);
          }
          
        } catch (updateError) {
          console.error('Error updating profile:', updateError.response?.data || updateError.message);
          
          // Let's check what kind of error we're getting
          if (updateError.response) {
            console.log('Response status:', updateError.response.status);
            console.log('Response headers:', updateError.response.headers);
            console.log('Response data:', updateError.response.data);
          }
          
          // If it's an auth error, the token might be invalid or missing patientId
          console.log('\nChecking token payload:');
          try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            console.log('Token payload:', payload);
            
            if (!payload.patientId) {
              console.log('⚠️ Token is missing patientId - this could be the issue');
            }
          } catch (e) {
            console.error('Error decoding token:', e.message);
          }
        }
        
      } catch (profileError) {
        console.error('Error retrieving profile:', profileError.response?.data || profileError.message);
      }
      
    } catch (verifyError) {
      console.error('OTP verification failed:', verifyError.response?.data || verifyError.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('API error:', error.response.data);
    } else {
      console.error('Error in test script:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProfileApiFlow();
