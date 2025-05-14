// src/services/otpService.js
const { prisma } = require('../config');

// 1) Helper – generate a random 6-digit string
function genCode() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

// 2) Persist OTP in the database
async function storeOtp(email, code, context, patientId = null) {
  await prisma.oTP.create({
    data: {
      email,
      code,
      context,        // 'LOGIN' or 'EMAIL_CHANGE'
      patientId,      // only set for email-change
      expiresAt: new Date(Date.now() + 5 * 60e3), // 5 minutes from now
    }
  });
}

// 3) Public API: generate, store, and “send”
async function sendOtp(email, context, patientId = null) {
  const code = genCode();
  await storeOtp(email, code, context, patientId);
  console.log(`[${context}] OTP for ${email}${patientId ? ` (patient ${patientId})` : ''}: ${code}`);
  // TODO: replace console.log with an email/SMS provider call
}

// 4) Public API: verify and mark used
async function verifyOtp(email, code, context, patientId = null) {
  const record = await prisma.oTP.findFirst({
    where: { email, code, context, patientId, used: false }
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
