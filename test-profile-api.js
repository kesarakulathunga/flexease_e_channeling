// test-profile-api.js
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:4000/api';
const PATIENT_ID = 3; // From the check-profiles.js output

async function testProfileAPI() {
  try {
    console.log(`Testing profile API for patient ID: ${PATIENT_ID}`);
    
    // First, we need to get a valid token
    // Normally you would log in, but for test purposes let's check if we can access without auth first
    
    try {
      console.log('\n1. Trying to access profile without authentication:');
      const response = await axios.get(`${API_URL}/profile/patient/${PATIENT_ID}`);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      console.log('\nNOTE: This should have failed with a 401 error. If it didn\'t, your authentication middleware may be misconfigured.');
    } catch (error) {
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          console.log('✓ Authentication check working correctly (401 Unauthorized)');
        }
      } else {
        console.log('Error making request:', error.message);
      }
    }
    
    // Next, try with a mock authorization token (this should fail)
    try {
      console.log('\n2. Testing with invalid authentication token:');
      const response = await axios.get(
        `${API_URL}/profile/patient/${PATIENT_ID}`,
        { headers: { Authorization: 'Bearer invalid-token' } }
      );
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      console.log('\nWARNING: Invalid token was accepted. Token validation may be misconfigured.');
    } catch (error) {
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          console.log('✓ Token validation working correctly (401 Unauthorized)');
        }
      } else {
        console.log('Error making request:', error.message);
      }
    }
    
    // In a real scenario, we would log in first to get a valid token
    console.log('\nTo complete testing, you would need to:');
    console.log('1. Log in and get a valid token');
    console.log('2. Use that token to access the profile endpoint');
    console.log('\nSuggested next command:');
    console.log(`curl -X GET "${API_URL}/profile/patient/${PATIENT_ID}" -H "Authorization: Bearer YOUR_VALID_TOKEN"`);
    
  } catch (err) {
    console.error('Error in test script:', err);
  }
}

testProfileAPI();
