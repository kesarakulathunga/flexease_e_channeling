// complete-login.js
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'ex@g.c';
const PATIENT_ID = 3; // From the verified response

async function completeLogin() {
  try {
    console.log(`Completing login for patient ID: ${PATIENT_ID}`);
    
    // Select account to login
    const response = await axios.post(`${API_URL}/auth/select-account`, {
      email: EMAIL,
      patientId: PATIENT_ID
    });
    
    console.log('Response:', response.data);
    
    if (response.data.token) {
      console.log('\n✓ Successfully logged in and received token!');
      console.log(`\nFor API testing, you can use this curl command:`);
      console.log(`curl -X GET "${API_URL}/profile/patient/${PATIENT_ID}" \\
  -H "Authorization: Bearer ${response.data.token}"`);
      
      // Also save token to a file for easy access
      require('fs').writeFileSync('jwt-token.txt', response.data.token);
      console.log('\nToken saved to jwt-token.txt');
      
      return response.data.token;
    } else {
      console.log('\n✗ Failed to get token');
    }
  } catch (error) {
    console.error('Error completing login:', error.response ? error.response.data : error.message);
  }
}

completeLogin();
