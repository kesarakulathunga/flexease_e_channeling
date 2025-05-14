// test-verify-email-change.js
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:4000/api';
const NEW_EMAIL = 'new.email@example.com';
const OTP_CODE = '691476'; // From check-email-change-otp.js

async function testVerifyEmailChange() {
  try {
    console.log(`Testing verify email change endpoint`);
    console.log(`- New email: ${NEW_EMAIL}`);
    console.log(`- OTP code: ${OTP_CODE}`);
    
    // Read token from file
    const token = fs.readFileSync('jwt-token.txt', 'utf-8');
    console.log(`- Using token: ${token.substring(0, 20)}...`);
    
    // Call the verify email change endpoint
    const response = await axios.post(
      `${API_URL}/profile/email/verify-change`,
      { 
        newEmail: NEW_EMAIL,
        code: OTP_CODE
      },
      { headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status === 200) {
      console.log('\n✓ Successfully verified and completed email change!');
      
      // Save the new token if provided
      if (response.data.token) {
        fs.writeFileSync('new-jwt-token.txt', response.data.token);
        console.log('\nNew token saved to new-jwt-token.txt');
      }
      
      // Show final profile state
      console.log('\nFinal profile state:');
      console.log(response.data.profile);
    }
  } catch (error) {
    console.error('Error verifying email change:', error.response ? error.response.data : error.message);
  }
}

testVerifyEmailChange();
