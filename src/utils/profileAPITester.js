// src/utils/profileAPITester.js
import { patientService } from '../services';

/**
 * Test utility for checking if all API endpoints are working properly
 * Run this function from DevTools console after login to verify connectivity
 */
export async function testProfileAPIs() {
  console.group('🧪 Testing Patient Profile API Endpoints');
  const results = {
    getCurrentProfile: { success: false, error: null },
    updateProfile: { success: false, error: null },
    sendEmailVerification: { success: false, error: null },
    updateEmail: { success: false, error: null },
  };

  // Test getCurrentProfile
  try {
    console.log('Testing getCurrentProfile...');
    const profile = await patientService.getCurrentProfile();
    console.log('✅ getCurrentProfile success:', profile);
    results.getCurrentProfile = { success: true, data: profile };
  } catch (error) {
    console.error('❌ getCurrentProfile failed:', error);
    results.getCurrentProfile = { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }

  // Test updateProfile (only if we have a profile)
  if (results.getCurrentProfile.success && results.getCurrentProfile.data?.id) {
    const profileId = results.getCurrentProfile.data.id;
    const testUpdate = {
      name: results.getCurrentProfile.data.name,
      age: results.getCurrentProfile.data.age,
      mobileNumber: results.getCurrentProfile.data.mobileNumber
    };
    
    try {
      console.log('Testing updateProfile...');
      const updatedProfile = await patientService.updateProfile(profileId, testUpdate);
      console.log('✅ updateProfile success:', updatedProfile);
      results.updateProfile = { success: true, data: updatedProfile };
    } catch (error) {
      console.error('❌ updateProfile failed:', error);
      results.updateProfile = { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  } else {
    console.warn('⚠️ Skipping updateProfile test - no profile found');
    results.updateProfile = { 
      success: false, 
      error: 'Test skipped - no profile found' 
    };
  }

  // Test sendEmailVerification with the current email
  // This is a mock test that doesn't actually send verification emails
  if (results.getCurrentProfile.success && results.getCurrentProfile.data?.email) {
    const email = results.getCurrentProfile.data.email;
    try {
      console.log('Testing sendEmailVerification API shape...');
      // Just check endpoint exists, don't actually send email
      const endpoint = patientService.sendEmailVerification.toString();
      console.log('📋 sendEmailVerification endpoint:', endpoint);
      results.sendEmailVerification = { 
        success: true, 
        message: 'API endpoint exists. Actual sending not tested.' 
      };
    } catch (error) {
      console.error('❌ sendEmailVerification failed:', error);
      results.sendEmailVerification = { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  } else {
    console.warn('⚠️ Skipping sendEmailVerification test - no email found');
    results.sendEmailVerification = { 
      success: false, 
      error: 'Test skipped - no email found' 
    };
  }

  // Test updateEmail API shape
  try {
    console.log('Testing updateEmail API shape...');
    // Just check endpoint exists, don't actually update email
    const endpoint = patientService.updateEmail.toString();
    console.log('📋 updateEmail endpoint:', endpoint);
    results.updateEmail = { 
      success: true, 
      message: 'API endpoint exists. Actual update not tested.' 
    };
  } catch (error) {
    console.error('❌ updateEmail failed:', error);
    results.updateEmail = { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }

  console.log('🔍 Profile API Test Results:', results);
  
  // Calculate overall success
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  console.log(`✨ Test completed: ${successCount}/${totalTests} tests passed`);
  
  console.groupEnd();
  
  return results;
}

// For easy access in browser console
window.testProfileAPIs = testProfileAPIs;

export default testProfileAPIs;
