// test-get-profile.js
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:4000/api';
const PATIENT_ID = 3;

async function testGetProfile() {
  try {
    console.log(`Testing GET profile endpoint for patient ID: ${PATIENT_ID}`);
    
    // Read token from file
    const token = fs.readFileSync('jwt-token.txt', 'utf-8');
    console.log(`Using token: ${token.substring(0, 20)}...`);
    
    // Call the GET profile endpoint
    const response = await axios.get(
      `${API_URL}/profile/patient/${PATIENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('\nResponse status:', response.status);
    console.log('Profile data:', response.data);
    
    if (response.status === 200) {
      console.log('\n✓ Successfully retrieved profile!');
    }
  } catch (error) {
    console.error('Error getting profile:', error.response ? error.response.data : error.message);
  }
}

testGetProfile();
