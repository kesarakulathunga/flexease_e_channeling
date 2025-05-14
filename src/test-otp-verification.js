// Test script for OTP verification with purpose parameter
import { authService, appointmentService } from './services';
import api from './services/api';

// Function to expose testing capabilities to browser console
const setupOTPTesting = () => {
  // Direct test function to run in browser console
  window.testOTP = async (email, otp) => {
    console.group('🔍 OTP Verification Test');
    console.log(`Testing OTP verification for email: ${email}, OTP: ${otp}`);
    
    try {
      // Test 1: Direct API call
      console.group('Test 1: Direct API call');
      try {
        const rawData = { email, otp, purpose: 'registration' };
        console.log('Request payload:', rawData);
        const rawResponse = await api.post('/auth/verify-email', rawData);
        console.log('✅ SUCCESS: Direct API call successful');
        console.log('Response:', rawResponse);
      } catch (error) {
        console.error('❌ FAILED: Direct API call failed');
        console.error('Error:', error.response?.data || error.message);
      }
      console.groupEnd();
      
      // Test 2: Using authService for registration
      console.group('Test 2: Using authService.verifyOTP (registration)');
      try {
        const authResponse = await authService.verifyOTP(email, otp, 'registration');
        console.log('✅ SUCCESS: authService.verifyOTP successful');
        console.log('Response:', authResponse);
      } catch (error) {
        console.error('❌ FAILED: authService.verifyOTP failed');
        console.error('Error:', error.response?.data || error.message);
      }
      console.groupEnd();
      
      // Test 3: Using authService for view_profile
      console.group('Test 3: Using authService.verifyOTP (view_profile)');
      try {
        const viewProfileResponse = await authService.verifyOTP(email, otp, 'view_profile');
        console.log('✅ SUCCESS: authService.verifyOTP (view_profile) successful');
        console.log('Response:', viewProfileResponse);
      } catch (error) {
        console.error('❌ FAILED: authService.verifyOTP (view_profile) failed');
        console.error('Error:', error.response?.data || error.message);
      }
      console.groupEnd();
      
      // Test 4: Using appointmentService
      console.group('Test 4: Using appointmentService.verifyAppointmentOTP');
      try {
        const appointmentResponse = await appointmentService.verifyAppointmentOTP(email, otp);
        console.log('✅ SUCCESS: appointmentService.verifyAppointmentOTP successful');
        console.log('Response:', appointmentResponse);
      } catch (error) {
        console.error('❌ FAILED: appointmentService.verifyAppointmentOTP failed');
        console.error('Error:', error.response?.data || error.message);
      }
      console.groupEnd();
      
    } catch (error) {
      console.error('Test execution failed:', error);
    }
    
    console.groupEnd();
    
    console.log('\n✨ Test completed! Check results above.');
  };
  
  // Add a mock function to test when backend is down
  window.mockVerifyOTP = (email, otp) => {
    console.group('🔍 Mock OTP Verification');
    console.log(`Creating mock verification response for ${email} with OTP: ${otp}`);
    
    // Validate OTP format for realistic testing
    if (!otp || typeof otp !== 'string') {
      console.error('❌ Mock validation failed: OTP must be a string');
      console.groupEnd();
      return { error: 'OTP must be a string' };
    }
    
    const otpTrimmed = otp.trim();
    if (!/^\d{6}$/.test(otpTrimmed)) {
      console.error('❌ Mock validation failed: OTP must be exactly 6 digits');
      console.groupEnd();
      return { error: 'OTP must be exactly 6 digits' };
    }
    
    // Simulate successful response
    const mockResponse = {
      success: true,
      user: { email, name: "Test User" },
      token: "mock-token-for-testing-" + Math.random().toString(36).substring(2, 10),
      profiles: [{
        id: "mock-profile-1",
        name: "Test User",
        age: 30,
        email: email,
        nic: "123456789X"
      }],
      hasExistingAccounts: true
    };
    
    console.log('✅ Mock verification successful!');
    console.log('Mock response:', mockResponse);
    console.groupEnd();
    
    // Store mock data in localStorage to simulate a successful login
    localStorage.setItem('authToken', mockResponse.token);
    localStorage.setItem('user', JSON.stringify(mockResponse.user));
    localStorage.setItem('userRole', 'PATIENT');
    localStorage.setItem('currentProfile', JSON.stringify(mockResponse.profiles[0]));
    
    // Dispatch event to notify auth context
    window.dispatchEvent(new Event('storage:authchange'));
    
    return mockResponse;
  };
  
  console.log('🔧 OTP testing functions are now available:');
  console.log('1. Use window.testOTP(email, otp) to test real verification');
  console.log('2. Use window.mockVerifyOTP(email, otp) for offline testing without backend');
};

// Execute setup
setupOTPTesting();
