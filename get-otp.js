// get-otp.js
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'ex@g.c';

async function getOtp() {
  try {
    console.log(`Requesting OTP for email: ${EMAIL}`);
    
    // Request OTP
    const response = await axios.post(`${API_URL}/auth/check-email`, {
      email: EMAIL,
      purpose: 'view_profile'
    });
    
    console.log('OTP request response:', response.data);
    
    console.log('\nNOTE: Check server logs for the OTP code');
    console.log('Look for a log entry like: [LOGIN] OTP for ex@g.c (purpose: view_profile): 123456');
    
  } catch (error) {
    console.error('Error requesting OTP:', error.response ? error.response.data : error.message);
  }
}

getOtp();
