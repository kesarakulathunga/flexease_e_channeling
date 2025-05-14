// verify-otp.js
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'ex@g.c';
const OTP = '821413'; // Updated OTP from check-latest-otp.js output

async function verifyOtp() {
  try {
    console.log(`Verifying OTP for email ${EMAIL} with code ${OTP}`);
    
    // Verify OTP
    const response = await axios.post(`${API_URL}/auth/verify-email`, {
      email: EMAIL,
      code: OTP,
      purpose: 'view_profile'
    });
    
    console.log('Verification response:', response.data);
    
    if (response.data.token) {
      console.log('\n✓ Successfully logged in and received token!');
      console.log(`\nFor API testing, you can use this curl command:`);
      console.log(`curl -X PUT "${API_URL}/profile/patient/3" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${response.data.token}" \\
  -d '{"fullName": "Updated Name", "age": 56, "nicNumber": "20001830204P", "mobileNumber": "0771234567"}'`);
      
      // Also save token to a file for easy access
      require('fs').writeFileSync('jwt-token.txt', response.data.token);
      console.log('\nToken saved to jwt-token.txt');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.response ? error.response.data : error.message);
  }
}

verifyOtp();
