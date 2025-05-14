// test-profile-editing.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const API_URL = 'http://localhost:3000/api';

// Setup logging
const logFilePath = path.join(__dirname, 'profile-test-logs.txt');
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
  console.log(message);
}

// Clear previous log file
fs.writeFileSync(logFilePath, `Profile Edit Test Started at ${new Date().toISOString()}\n`);

// Helper function to extract OTP from logs
async function extractOtpFromLogs(email, purpose) {
  try {
    // Wait a moment for logs to be written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if logs directory exists
    if (!fs.existsSync(path.join(__dirname, 'logs'))) {
      console.log('Logs directory not found, using default OTP for testing');
      return '123456';
    }
    
    // Read log file
    const logFile = path.join(__dirname, 'logs', 'application.log');
    if (!fs.existsSync(logFile)) {
      console.log('Log file not found, using default OTP for testing');
      return '123456';
    }
    
    const logs = fs.readFileSync(logFile, 'utf8');
    
    // Look for OTP in logs
    const otpPattern = new RegExp(`OTP for ${email}.*?(\\d{6})`, 'i');
    const otpMatch = logs.match(otpPattern);
    
    if (otpMatch && otpMatch[1]) {
      console.log(`Extracted OTP from logs: ${otpMatch[1]}`);
      return otpMatch[1];
    }
    
    // Try the console log format
    const consoleLogPattern = new RegExp(`\\[LOGIN\\] OTP for ${email}.*?(\\d{6})`, 'i');
    const consoleMatch = logs.match(consoleLogPattern);
    
    if (consoleMatch && consoleMatch[1]) {
      console.log(`Extracted OTP from console logs: ${consoleMatch[1]}`);
      return consoleMatch[1];
    }
    
    console.log('Could not extract OTP from logs, using default for testing');
    return '123456';
  } catch (error) {
    console.error('Error extracting OTP:', error);
    return '123456'; // Default OTP for testing
  }
}

// Test Profile Editing Flow
async function testProfileEditing() {
  try {
    logToFile('=== TESTING PROFILE EDITING ===');
    let testResults = {
      register: false,
      getProfile: false,
      updateBasicInfo: false,
      initiateEmailChange: false,
      completeEmailChange: false,
      finalProfileCheck: false
    };
    
    // Step 1: Register a test patient
    logToFile('\n1. Register Test Patient');
    const email = `test.patient${Date.now()}@example.com`;
    
    // Check email
    logToFile(`Checking email: ${email}`);
    let otp = '';
    try {
      const checkEmailResponse = await apiRequest('POST', '/auth/check-email', {
        email,
        purpose: 'registration'
      });
      
      // Extract OTP from console logs (this is for testing only)
      // In production, OTP would be delivered via email
      const otpMatch = /OTP for.*: (\d{6})/.exec(JSON.stringify(checkEmailResponse));
      if (otpMatch && otpMatch[1]) {
        otp = otpMatch[1];
        logToFile(`Extracted OTP from response: ${otp}`);
      } else {
        // For manual testing, use a fixed OTP
        otp = '123456';
        logToFile(`Using hardcoded OTP for testing: ${otp}`);
      }
    } catch (error) {
      logToFile(`❌ Check email failed: ${error.message}`);
      return;
    }
    
    // Verify email with OTP
    try {
      logToFile(`Verifying email with OTP: ${otp}`);
      await apiRequest('POST', '/auth/verify-email', {
        email,
        code: otp,
        purpose: 'registration'
      });
    } catch (error) {
      logToFile(`❌ Email verification failed: ${error.message}`);
      return;
    }
    
    // Create patient account
    let token, patientId;
    try {
      logToFile('Creating patient account');
      const patientData = {
        email,
        verifiedEmail: email,
        fullName: 'Test Patient',
        age: 30,
        nicNumber: 'NIC12345',
        mobileNumber: '1234567890'
      };
      const createPatientResponse = await apiRequest('POST', '/patients/register-verified', patientData);
      
      token = createPatientResponse.token;
      patientId = createPatientResponse.patient.id;
      
      if (!token || !patientId) {
        throw new Error('Registration did not return a valid token or patient ID');
      }
      
      testResults.register = true;
      logToFile(`✅ Patient registered successfully with ID: ${patientId}`);
    } catch (error) {
      logToFile(`❌ Patient registration failed: ${error.message}`);
      return;
    }
    
    // Step 2: Get Profile
    let profileData;
    try {
      logToFile('\n2. Get Patient Profile');
      profileData = await apiRequest('GET', `/profile/patient/${patientId}`, null, token);
      
      // Validate profile data
      if (profileData.id !== patientId || profileData.email !== email) {
        throw new Error('Retrieved profile data does not match expected values');
      }
      
      testResults.getProfile = true;
      logToFile(`✅ Profile retrieved successfully`);
    } catch (error) {
      logToFile(`❌ Getting profile failed: ${error.message}`);
    }
    
    // Step 3: Update Basic Profile Info
    try {
      logToFile('\n3. Update Basic Profile Info');
      const updateData = {
        fullName: 'Updated Test Patient',
        age: 35,
        nicNumber: 'NIC54321',
        mobileNumber: '0987654321'
      };
      const updateResponse = await apiRequest('PUT', `/profile/patient/${patientId}`, updateData, token);
      
      // Validate update
      if (updateResponse.fullName !== updateData.fullName || 
          updateResponse.age !== updateData.age || 
          updateResponse.nicNumber !== updateData.nicNumber || 
          updateResponse.mobileNumber !== updateData.mobileNumber) {
        throw new Error('Updated profile does not match the data sent');
      }
      
      testResults.updateBasicInfo = true;
      logToFile(`✅ Profile updated successfully`);
    } catch (error) {
      logToFile(`❌ Profile update failed: ${error.message}`);
    }
    
    // Step 4: Initiate Email Change
    const newEmail = `new.email${Date.now()}@example.com`;
    let emailChangeOtp = '';
    try {
      logToFile('\n4. Initiate Email Change');
      const initiateEmailChangeResponse = await apiRequest('POST', '/profile/email/initiate-change', {
        newEmail
      }, token);
      
      // Extract OTP from console logs (testing only)
      const otpMatch = /OTP for.*: (\d{6})/.exec(JSON.stringify(initiateEmailChangeResponse));
      if (otpMatch && otpMatch[1]) {
        emailChangeOtp = otpMatch[1];
        logToFile(`Extracted email change OTP from response: ${emailChangeOtp}`);
      } else {
        // For manual testing, use a fixed OTP
        emailChangeOtp = '123456';
        logToFile(`Using hardcoded OTP for testing: ${emailChangeOtp}`);
      }
      
      testResults.initiateEmailChange = true;
      logToFile(`✅ Email change initiated successfully`);
    } catch (error) {
      logToFile(`❌ Email change initiation failed: ${error.message}`);
    }
    
    // Step 5: Verify and Complete Email Change
    let newToken;
    try {
      logToFile('\n5. Verify and Complete Email Change');
      const verifyEmailChangeResponse = await apiRequest('POST', '/profile/email/verify-change', {
        newEmail,
        code: emailChangeOtp
      }, token);
      
      newToken = verifyEmailChangeResponse.token;
      
      if (!newToken) {
        throw new Error('Email change did not return a new token');
      }
      
      testResults.completeEmailChange = true;
      logToFile(`✅ Email change completed successfully`);
    } catch (error) {
      logToFile(`❌ Email change verification failed: ${error.message}`);
    }
    
    // Step 6: Get Updated Profile with New Token
    try {
      logToFile('\n6. Get Updated Profile with New Token');
      const tokenToUse = newToken || token; // Fallback to old token if email change failed
      const updatedProfileResponse = await apiRequest('GET', `/profile/patient/${patientId}`, null, tokenToUse);
      
      // Validate that email was changed
      if (testResults.completeEmailChange && updatedProfileResponse.email !== newEmail) {
        throw new Error('Profile email was not updated correctly');
      }
      
      testResults.finalProfileCheck = true;
      logToFile(`✅ Final profile check successful`);
    } catch (error) {
      logToFile(`❌ Final profile check failed: ${error.message}`);
    }
    
    // Final test results summary
    logToFile('\n=== PROFILE EDITING TEST RESULTS ===');
    for (const [test, passed] of Object.entries(testResults)) {
      logToFile(`${passed ? '✅' : '❌'} ${test}`);
    }
    
    const allTestsPassed = Object.values(testResults).every(result => result === true);
    if (allTestsPassed) {
      logToFile('\n✅✅✅ ALL TESTS PASSED SUCCESSFULLY ✅✅✅');
    } else {
      logToFile('\n❌❌❌ SOME TESTS FAILED ❌❌❌');
    }
    
  } catch (error) {
    logToFile(`❌ Test failed with unexpected error: ${error.message}`);
    if (error.stack) {
      logToFile(`Error stack: ${error.stack}`);
    }
  }
}

// Run the test
testProfileEditing();
