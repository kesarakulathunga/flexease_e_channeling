// src/services/enhancedOtpService.js
const { prisma } = require('../config');
const { sendOtpEmail } = require('./otpEmailService');

// 1) Helper – generate a random 6-digit string
function genCode() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

// 2) Persist OTP in the database
async function storeOtp(email, code, context, patientId = null, purpose = 'registration') {
  await prisma.oTP.create({
    data: {
      email,
      code,
      context,        // 'LOGIN' or 'EMAIL_CHANGE'
      patientId,      // only set for email-change
      purpose,        // 'registration', 'view_profile', 'admin_login', etc.
      expiresAt: new Date(Date.now() + 5 * 60e3), // 5 minutes from now
    }
  });
}

// 3) Public API: generate, store, and "send"
async function sendOtp(email, context, patientId = null, purpose = 'registration') {
  const code = genCode();
  await storeOtp(email, code, context, patientId, purpose);
  
  // Log the OTP for development purposes (keeping this for backward compatibility)
  console.log(`[${context}] OTP for ${email}${patientId ? ` (patient ${patientId})` : ''} (purpose: ${purpose}): ${code}`);
    // Send the OTP via email service
  try {
    const emailResult = await sendOtpEmail(email, code, context, purpose);
    
    if (emailResult.success === false) {
      console.log(`[${context}] Email delivery failed, but OTP flow continues. OTP: ${code}`);
    }
    
    if (emailResult.messageUrl) {
      console.log(`[${context}] Email preview available at: ${emailResult.messageUrl}`);
    }
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error.message);
    // Don't re-throw the error - we still want the flow to continue even if email fails
    // This ensures backward compatibility
  }
}

// 4) Public API: verify and mark used
async function verifyOtp(email, code, context, patientId = null, purpose = 'registration') {
  const record = await prisma.oTP.findFirst({
    where: { email, code, context, patientId, used: false, purpose }
  });
  if (!record || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired OTP');
  }
  await prisma.oTP.update({
    where: { id: record.id },
    data: { used: true }
  });
  return record;
}

module.exports = { sendOtp, verifyOtp };
