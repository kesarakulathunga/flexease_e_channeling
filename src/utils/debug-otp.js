// src/utils/debug-otp.js
/**
 * Debug utilities for OTP verification
 * This file contains helper functions to debug OTP verification issues
 */

import { authService, appointmentService } from '../services';

/**
 * Test OTP verification with both services
 * @param {string} email Email to test
 * @param {string} otp OTP to verify
 */
export const testOtpVerification = async (email, otp) => {
  try {
    console.group('Debug OTP Verification');
    console.log('Testing OTP verification for:', email);
    console.log('OTP:', otp);
    
    // Test with appointment service first
    try {
      console.group('1. Using appointmentService.verifyAppointmentOTP');
      const appointmentResponse = await appointmentService.verifyAppointmentOTP(email, otp);
      console.log('✅ SUCCESS! Response:', appointmentResponse);
      console.groupEnd();
    } catch (err) {
      console.log('❌ FAILED with appointmentService:', err.message);
      console.error('Error details:', err.response?.data || err);
      console.groupEnd();
    }
    
    // Test with auth service with registration purpose
    try {
      console.group('2. Using authService.verifyOTP with purpose=registration');
      const authResponse = await authService.verifyOTP(email, otp, 'registration');
      console.log('✅ SUCCESS! Response:', authResponse);
      console.groupEnd();
    } catch (err) {
      console.log('❌ FAILED with authService (registration):', err.message);
      console.error('Error details:', err.response?.data || err);
      console.groupEnd();
    }
    
    // Test with auth service with view_profile purpose
    try {
      console.group('3. Using authService.verifyOTP with purpose=view_profile');
      const viewProfileResponse = await authService.verifyOTP(email, otp, 'view_profile');
      console.log('✅ SUCCESS! Response:', viewProfileResponse);
      console.groupEnd();
    } catch (err) {
      console.log('❌ FAILED with authService (view_profile):', err.message);
      console.error('Error details:', err.response?.data || err);
      console.groupEnd();
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Export a global debug function that can be called from the browser console
window.testOtpVerification = testOtpVerification;

/**
 * Test OTP verification with direct API calls
 * This bypasses our service layers to test the raw API
 * @param {string} email Email to test
 * @param {string} otp OTP to verify
 */
export const testOtpVerificationDirectApi = async (email, otp) => {
  const apiUrl = '/auth/verify-email'; // Base URL without domain (handled by axios)
  
  try {
    console.group('Debug OTP Verification - Direct API Tests');
    
    // Prepare axios instance from our API module
    const api = (await import('../services/api')).default;
    
    // Test with explicit purpose=registration
    try {
      console.group('1. Direct API call with purpose=registration');
      const data = { email, otp, purpose: 'registration' };
      console.log('Request payload:', data);
      const response = await api.post(apiUrl, data);
      console.log('✅ SUCCESS! Response:', response);
      console.groupEnd();
    } catch (err) {
      console.log('❌ FAILED with direct API call (registration):', err.message);
      console.error('Error details:', err.response?.data || err);
      console.groupEnd();
    }
    
    // Test with explicit purpose=view_profile
    try {
      console.group('2. Direct API call with purpose=view_profile');
      const data = { email, otp, purpose: 'view_profile' };
      console.log('Request payload:', data);
      const response = await api.post(apiUrl, data);
      console.log('✅ SUCCESS! Response:', response);
      console.groupEnd();
    } catch (err) {
      console.log('❌ FAILED with direct API call (view_profile):', err.message);
      console.error('Error details:', err.response?.data || err);
      console.groupEnd();
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('Direct API test failed:', error);
  }
};

// Export the direct API test function globally too
window.testOtpVerificationDirectApi = testOtpVerificationDirectApi;
