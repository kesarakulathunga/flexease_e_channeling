// test-update-profile.js
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:4000/api';
const PATIENT_ID = 3;

async function testUpdateProfile() {
  try {
    console.log(`Testing UPDATE profile endpoint for patient ID: ${PATIENT_ID}`);
    
    // Read token from file
    const token = fs.readFileSync('jwt-token.txt', 'utf-8');
    console.log(`Using token: ${token.substring(0, 20)}...`);
    
    // First, get the current profile
    const profileResponse = await axios.get(
      `${API_URL}/profile/patient/${PATIENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const currentProfile = profileResponse.data;
    console.log('\nCurrent profile:', currentProfile);
    
    // Create updated data - change mobile number and add 1 to age
    const updateData = {
      fullName: currentProfile.fullName,
      age: currentProfile.age + 1,
      nicNumber: currentProfile.nicNumber,
      mobileNumber: '0771234567'
    };
    
    console.log('\nUpdating profile with:', updateData);
    
    // Call the UPDATE profile endpoint
    const updateResponse = await axios.put(
      `${API_URL}/profile/patient/${PATIENT_ID}`,
      updateData,
      { headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('\nResponse status:', updateResponse.status);
    console.log('Updated profile:', updateResponse.data);
    
    if (updateResponse.status === 200) {
      console.log('\n✓ Successfully updated profile!');
      
      // Verify that updatedAt has changed
      const oldUpdatedAt = new Date(currentProfile.updatedAt);
      const newUpdatedAt = new Date(updateResponse.data.updatedAt);
      
      console.log(`\nOld updatedAt: ${oldUpdatedAt.toISOString()}`);
      console.log(`New updatedAt: ${newUpdatedAt.toISOString()}`);
      console.log(`updatedAt changed: ${newUpdatedAt > oldUpdatedAt ? 'Yes ✓' : 'No ✗'}`);
      
      // Restore original values
      console.log('\nRestoring original values...');
      
      const restoreData = {
        fullName: currentProfile.fullName,
        age: currentProfile.age,
        nicNumber: currentProfile.nicNumber,
        mobileNumber: currentProfile.mobileNumber
      };
      
      const restoreResponse = await axios.put(
        `${API_URL}/profile/patient/${PATIENT_ID}`,
        restoreData,
        { headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('Original values restored:', restoreResponse.status === 200 ? 'Yes ✓' : 'No ✗');
    }
  } catch (error) {
    console.error('Error updating profile:', error.response ? error.response.data : error.message);
  }
}

testUpdateProfile();
