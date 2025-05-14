// test-with-new-token.js
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:4000/api';
const PATIENT_ID = 3;

async function testWithNewToken() {
  try {
    console.log(`Testing profile access with new token after email change`);
    
    // Read new token from file
    const token = fs.readFileSync('new-jwt-token.txt', 'utf-8');
    console.log(`Using new token: ${token.substring(0, 20)}...`);
    
    // Call the GET profile endpoint
    const response = await axios.get(
      `${API_URL}/profile/patient/${PATIENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('\nResponse status:', response.status);
    console.log('Profile data:', response.data);
    
    if (response.status === 200) {
      console.log('\n✓ Successfully accessed profile with new token!');
      console.log(`\nVerified email is now: ${response.data.email}`);
    }
  } catch (error) {
    console.error('Error accessing profile with new token:', error.response ? error.response.data : error.message);
  }
}

testWithNewToken();
