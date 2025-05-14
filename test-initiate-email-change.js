// test-initiate-email-change.js
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:4000/api';
const NEW_EMAIL = 'new.email@example.com';

async function testInitiateEmailChange() {
  try {
    console.log(`Testing initiate email change endpoint with new email: ${NEW_EMAIL}`);
    
    // Read token from file
    const token = fs.readFileSync('jwt-token.txt', 'utf-8');
    console.log(`Using token: ${token.substring(0, 20)}...`);
    
    // Call the initiate email change endpoint
    const response = await axios.post(
      `${API_URL}/profile/email/initiate-change`,
      { newEmail: NEW_EMAIL },
      { headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status === 200) {
      console.log('\n✓ Successfully initiated email change!');
      console.log('\nCheck the database for the OTP sent to the new email.');
    }
  } catch (error) {
    console.error('Error initiating email change:', error.response ? error.response.data : error.message);
  }
}

testInitiateEmailChange();
