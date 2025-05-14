// login-and-test-profile.js
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:4000/api';
const PATIENT_ID = 3;
const USER_EMAIL = 'ex@g.c'; // This should match the email we found in the database

async function loginAndTestProfile() {
  try {
    console.log('Testing login and profile access flow');
    console.log(`Using email: ${USER_EMAIL}`);
      // Step 1: Initiate OTP login
    console.log('\n1. Initiating OTP login:');
    try {
      const initResponse = await axios.post(`${API_URL}/auth/check-email`, {
        email: USER_EMAIL,
        purpose: 'view_profile'
      });
      
      console.log('OTP Initiation Response:', initResponse.data);
      
      // In a real flow, the user would receive an OTP and enter it
      // For testing, we'll check the server logs and use a dummy OTP
      console.log('\nNOTE: Check server logs for the OTP that was generated');
      console.log('Sample OTP format in logs: [LOGIN] OTP for ex@g.c: 123456');
        const otp = '615164'; // The actual OTP from the database
      console.log(`\nUsing OTP: ${otp} (retrieved from the database)`);
        // Step 2: Verify OTP
      console.log('\n2. Verifying OTP:');
      const verifyResponse = await axios.post(`${API_URL}/auth/verify-email`, {
        email: USER_EMAIL,
        code: otp,
        purpose: 'view_profile'
      });
      
      console.log('Verification Response:', verifyResponse.data);
      
      if (verifyResponse.data.token) {
        const token = verifyResponse.data.token;
        console.log(`\nToken received: ${token.substring(0, 20)}...`);
        
        // Step 3: Access profile with token
        console.log('\n3. Accessing profile with token:');
        const profileResponse = await axios.get(
          `${API_URL}/profile/patient/${PATIENT_ID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('Profile Response Status:', profileResponse.status);
        console.log('Profile Data:', profileResponse.data);
        
        if (profileResponse.data) {
          console.log('\n✓ Profile accessed successfully!');
        }
      } else {
        console.log('\n✗ No token received from verification endpoint');
      }
      
    } catch (error) {
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      } else {
        console.log('Error making request:', error.message);
      }
    }
    
  } catch (err) {
    console.error('Error in test script:', err);
  }
}

loginAndTestProfile();
