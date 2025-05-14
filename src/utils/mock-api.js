// src/utils/mock-api.js
/**
 * Mock API module for testing when the backend is unavailable
 * This provides simulated responses for API calls to test frontend functionality
 */

// Store enabled state
let mockingEnabled = false;

// Enable or disable mocking
export const enableMockApi = (enabled = true) => {
  mockingEnabled = enabled;
  console.log(`Mock API ${enabled ? 'enabled' : 'disabled'}`);
  return mockingEnabled;
};

// Check if mocking is enabled
export const isMockApiEnabled = () => mockingEnabled;

// Mock verification response
export const mockVerifyOtp = (email, otp, purpose = 'registration') => {
  console.log(`Mock verifyOtp: ${email}, ${otp}, ${purpose}`);
  
  // Validate OTP format
  if (!otp || typeof otp !== 'string') {
    throw new Error('OTP must be a string');
  }
  
  const otpTrimmed = otp.trim();
  if (!/^\d{6}$/.test(otpTrimmed)) {
    throw new Error('OTP must be exactly 6 digits');
  }
  
  // If OTP is specific test value, simulate failure
  if (otpTrimmed === '000000') {
    throw {
      response: {
        status: 401,
        data: { message: 'Invalid or expired OTP' }
      }
    };
  }
  
  // Return successful response
  return {
    user: { email, name: "Test User" },
    token: "mock-token-" + Math.random().toString(36).substring(2, 10),
    profiles: [{
      id: "mock-profile-1",
      name: "Test User",
      age: 30,
      email: email,
      nic: "123456789X"
    }]
  };
};

// Mock send OTP response
export const mockCheckEmail = (email, isResend = false, purpose = 'registration') => {
  console.log(`Mock checkEmail: ${email}, ${isResend}, ${purpose}`);
  
  // Simple email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    throw {
      response: {
        status: 400,
        data: { message: 'Invalid email format' }
      }
    };
  }
  
  // For specific email, simulate not found
  if (email === 'notfound@example.com') {
    throw {
      response: {
        status: 404,
        data: { message: 'Email not found' }
      }
    };
  }
  
  // Return successful response
  return { message: 'OTP sent successfully' };
};

// Mock account selection
export const mockSelectAccount = (profileId) => {
  console.log(`Mock selectAccount: ${profileId}`);
  
  return {
    profile: {
      id: profileId,
      name: "Test User",
      age: 30,
      email: "test@example.com",
      nic: "123456789X"
    }
  };
};

// Export all mock functions
export default {
  enableMockApi,
  isMockApiEnabled,
  mockVerifyOtp,
  mockCheckEmail,
  mockSelectAccount
};
