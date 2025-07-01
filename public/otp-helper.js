// otp-helper.js
/**
 * Injects a convenience function into the window object to retrieve OTPs.
 * FOR DEVELOPMENT USE ONLY - Never use in production!
 */
const BASE_URL = 'http://localhost:4000/api';

async function retrieveLatestOtp(email) {
  try {
    const response = await fetch(`${BASE_URL}/auth/dev/latest-otp?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve OTP');
    }
    const data = await response.json();
    console.log(`🔑 OTP for ${data.email}: ${data.code}`);
    return data.code;
  } catch (error) {
    console.error('Error retrieving OTP:', error);
    return null;
  }
}

// Automatically fill OTP field if present
async function autoFillOtp(email) {
  const otpCode = await retrieveLatestOtp(email);
  if (!otpCode) {
    console.error('No OTP found for', email);
    return;
  }
  
  // Find an input that looks like an OTP field
  const otpInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'))
    .filter(input => {
      const id = input.id?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const placeholder = input.placeholder?.toLowerCase() || '';
      return id.includes('otp') || name.includes('otp') || 
             placeholder.includes('otp') || placeholder.includes('verification code');
    });
  
  if (otpInputs.length > 0) {
    otpInputs[0].value = otpCode;
    otpInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    console.log('OTP auto-filled in input field');
  } else {
    // Maybe it's split into multiple fields
    const digitInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'))
      .filter(input => input.maxLength === 1);
    
    if (digitInputs.length === 6) {
      otpCode.split('').forEach((digit, i) => {
        if (digitInputs[i]) {
          digitInputs[i].value = digit;
          digitInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      console.log('OTP auto-filled in digit fields');
    } else {
      console.log('No suitable OTP input field found. Your code is:', otpCode);
    }
  }
}

// Add to window object
window.getOTP = retrieveLatestOtp;
window.autoFillOTP = autoFillOtp;

console.log('🔧 OTP Helper loaded! Use window.getOTP(email) to retrieve an OTP or window.autoFillOTP(email) to automatically fill it in the form.');
